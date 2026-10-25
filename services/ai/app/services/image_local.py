"""서버 안 그림 엔진 (diffusers). WebUI 없이 services/ai 프로세스 안에서 체크포인트를 직접 읽어 그린다.

2026-10-24 사용자 요청: 배포 때 따로 띄우는 WebUI를 쓰기 곤란하면 services/ai에 서버용 엔진을 두고 화풍별 모델을 적용한다.
`IMAGE_ENGINE=local`(기본)이면 이 엔진, `IMAGE_ENGINE=webui`면 예전처럼 WebUI API를 부른다 (image_engine.py).

- 모델 파일: `SD_MODEL_DIR`(기본 services/ai/models/)에 image_engine.STYLES의 체크포인트 파일 이름 그대로 둔다
- 설치: `pip install -r requirements-image.txt` (PyTorch CUDA·diffusers — 수 GB라 기본 requirements와 따로 둔다)
- 처음 읽을 때 diffusers가 모델 구성 파일(가중치 아님, 수십 KB)을 Hugging Face에서 받아 캐시에 둔다
- 그래픽 메모리에는 체크포인트 하나만 올린다. 화풍 계열이 바뀌면 내리고 새로 읽는다(처음 한 번 수십 초)

프롬프트는 WebUI 문법을 그대로 받는다 — photonet.compose가 쓰는 `(태그:1.2)` 가중치와 ` BREAK `(인물마다 따로 끊기).
WebUI처럼 75토큰씩 끊어 따로 인코딩해 이어 붙이고, 가중치는 토큰 임베딩에 곱한 뒤 평균을 원래대로 맞춘다.
"""

import gc
import io
import os
import re
import threading
from pathlib import Path

from fastapi import HTTPException

DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[2] / "models"
CHUNK_TOKENS = 75

# 그림은 한 번에 하나만 (그래픽 메모리 12GB에 둘이 동시에 올라가지 않는다)
_lock = threading.Lock()
_loaded: dict = {"name": None, "pipe": None, "xl": False}

WEIGHTED = re.compile(r"\(([^()]+?):\s*([0-9]*\.?[0-9]+)\)")


def model_dir() -> Path:
    return Path(os.environ.get("SD_MODEL_DIR") or DEFAULT_MODEL_DIR)


def _deps() -> str | None:
    """엔진을 쓸 수 없는 이유 (쓸 수 있으면 None)."""
    try:
        import diffusers  # noqa: F401
        import torch
    except ImportError:
        return "requirements-image.txt가 설치되지 않았다"
    if not torch.cuda.is_available():
        return "CUDA GPU를 찾지 못했다"
    return None


def status(wanted: set[str]) -> dict:
    """설치가 됐고, 쓰려는 체크포인트 파일이 모두 있나."""
    if _deps():
        return {"ready": False, "missing": []}
    missing = sorted(name for name in wanted if not (model_dir() / name).is_file())
    return {"ready": not missing, "missing": missing}


def parse_weighted(text: str) -> list[tuple[str, float]]:
    """"a, (adult woman:1.2), b" → [("a, ", 1.0), ("adult woman", 1.2), (", b", 1.0)]. 가중치 없는 괄호는 글자 그대로 둔다."""
    parts: list[tuple[str, float]] = []
    pos = 0
    for m in WEIGHTED.finditer(text):
        if m.start() > pos:
            parts.append((text[pos : m.start()], 1.0))
        parts.append((m.group(1), float(m.group(2))))
        pos = m.end()
    if pos < len(text):
        parts.append((text[pos:], 1.0))
    return [(t, w) for t, w in parts if t.strip()]


def _chunks(tokenizer, prompt: str) -> list[tuple[list[int], list[float]]]:
    """BREAK마다, 그리고 75토큰마다 끊은 (토큰 id, 가중치) 묶음. 시작·끝·채움 토큰의 가중치는 1"""
    out: list[tuple[list[int], list[float]]] = []
    bos, eos = tokenizer.bos_token_id, tokenizer.eos_token_id
    pad = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else eos
    for segment in prompt.split(" BREAK ") or [""]:
        ids: list[int] = []
        weights: list[float] = []
        for text, weight in parse_weighted(segment):
            piece = tokenizer(text, add_special_tokens=False).input_ids
            ids.extend(piece)
            weights.extend([weight] * len(piece))
        for start in range(0, max(len(ids), 1), CHUNK_TOKENS):
            body = ids[start : start + CHUNK_TOKENS]
            w = weights[start : start + CHUNK_TOKENS]
            fill = CHUNK_TOKENS - len(body)
            out.append(([bos, *body, eos] + [pad] * fill, [1.0, *w, 1.0] + [1.0] * fill))
    return out


def _encode(pipe, xl: bool, prompt: str):
    """WebUI 방식 인코딩 → (임베딩, pooled 또는 None)."""
    import torch

    device = pipe._execution_device
    encoders = [(pipe.tokenizer, pipe.text_encoder)] + ([(pipe.tokenizer_2, pipe.text_encoder_2)] if xl else [])
    per_encoder = []
    pooled = None
    for index, (tokenizer, encoder) in enumerate(encoders):
        pieces = []
        for ids, weights in _chunks(tokenizer, prompt):
            ids_t = torch.tensor([ids], device=device)
            out = encoder(ids_t, output_hidden_states=True)
            # SDXL은 두 인코더 모두 끝에서 두 번째 층, SD 1.5는 마지막 층 (diffusers 기본과 같다)
            z = out.hidden_states[-2] if xl else out[0]
            if xl and index == 1 and pooled is None:
                pooled = out[0]
            w = torch.tensor(weights, device=device, dtype=z.dtype)[None, :, None]
            original = z.mean()
            z = z * w
            z = z * (original / z.mean())
            pieces.append(z)
        per_encoder.append(torch.cat(pieces, dim=1))
    embeds = torch.cat(per_encoder, dim=-1) if xl else per_encoder[0]
    return embeds, pooled


def _pad_to(a, b, empty):
    """두 임베딩의 길이(묶음 수)를 빈 묶음으로 맞춘다 (WebUI와 같다)."""
    import torch

    while a.shape[1] < b.shape[1]:
        a = torch.cat([a, empty], dim=1)
    while b.shape[1] < a.shape[1]:
        b = torch.cat([b, empty], dim=1)
    return a, b


def _pipeline(path: Path, xl: bool):
    import torch
    from diffusers import EulerAncestralDiscreteScheduler, StableDiffusionPipeline, StableDiffusionXLPipeline

    if _loaded["name"] == path.name:
        return _loaded["pipe"]
    # 다른 체크포인트가 올라가 있으면 먼저 내린다
    _loaded.update(name=None, pipe=None)
    gc.collect()
    torch.cuda.empty_cache()
    if xl:
        pipe = StableDiffusionXLPipeline.from_single_file(str(path), torch_dtype=torch.float16)
    else:
        # 그림 검수는 우리가 따로 한다(photonet_moderation). 기본 안전 검사기는 성인 모드 그림까지 검게 지운다
        pipe = StableDiffusionPipeline.from_single_file(
            str(path), torch_dtype=torch.float16, safety_checker=None, requires_safety_checker=False
        )
    # WebUI의 "Euler a"
    pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)
    if os.environ.get("SD_OFFLOAD") == "1":
        # 그래픽 메모리가 모자라면 쓰는 부분만 올렸다 내린다 (느려진다)
        pipe.enable_model_cpu_offload()
    else:
        pipe.to("cuda")
    pipe.set_progress_bar_config(disable=True)
    _loaded.update(name=path.name, pipe=pipe, xl=xl)
    return pipe


def txt2img(*, prompt: str, negative: str, checkpoint: str, xl: bool, width: int, height: int, steps: int, cfg: float) -> bytes:
    """그림 한 장(PNG 바이트). 설치·모델이 없으면 503, 그리다 실패하면 502."""
    if reason := _deps():
        raise HTTPException(status_code=503, detail=f"그림 엔진을 쓸 수 없어요 ({reason}).")
    path = model_dir() / checkpoint
    if not path.is_file():
        raise HTTPException(status_code=503, detail=f"그림 모델 파일이 없어요: {checkpoint}")
    import torch

    with _lock:
        try:
            pipe = _pipeline(path, xl)
            with torch.inference_mode():
                pos, pos_pooled = _encode(pipe, xl, prompt)
                neg, neg_pooled = _encode(pipe, xl, negative)
                empty, _ = _encode(pipe, xl, "")
                pos, neg = _pad_to(pos, neg, empty)
                extra = {"pooled_prompt_embeds": pos_pooled, "negative_pooled_prompt_embeds": neg_pooled} if xl else {}
                image = pipe(
                    prompt_embeds=pos,
                    negative_prompt_embeds=neg,
                    width=width,
                    height=height,
                    num_inference_steps=steps,
                    guidance_scale=cfg,
                    **extra,
                ).images[0]
        except HTTPException:
            raise
        except torch.cuda.OutOfMemoryError as exc:
            _loaded.update(name=None, pipe=None)
            gc.collect()
            torch.cuda.empty_cache()
            raise HTTPException(status_code=503, detail="그래픽 메모리가 모자라 그리지 못했어요. 잠시 후 다시 시도해 주세요.") from exc
        except Exception as exc:  # 모델·라이브러리 오류는 다양하다 — 원인은 서버 로그로
            raise HTTPException(status_code=502, detail="그림 엔진이 그림을 만들지 못했어요.") from exc
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()
