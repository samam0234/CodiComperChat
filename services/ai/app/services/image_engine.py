"""그림 엔진 (코디포토넷). 두 가지 중 하나로 그린다 — `IMAGE_ENGINE`:

- `local`(기본): services/ai 프로세스 안에서 diffusers로 직접 그린다 (image_local.py). 배포용 — WebUI가 필요 없다
- `webui`: 따로 띄운 Stable Diffusion WebUI(AUTOMATIC1111)의 API를 부른다 (scripts/start-sd-webui.cmd, 개발 PC용)

서비스에 쓰는 체크포인트는 아래 표에 적은 것만이다 — 모델 폴더에 다른 모델(성인용 등)이 있어도 화풍마다 체크포인트를 못 박아 그것을 쓰지 않는다.

- 애니메이션·웹툰: Animagine XL 4.0 Opt (SDXL, CreativeML Open RAIL++-M)
- 수채화·실사풍: Stable Diffusion 1.5 기본 모델 (CreativeML OpenRAIL-M)
"""

import base64
import io
import os
from dataclasses import dataclass

import httpx
from fastapi import HTTPException

from app.services import image_local

DEFAULT_URL = "http://127.0.0.1:7860"


def _url() -> str:
    return os.environ.get("SD_WEBUI_URL", DEFAULT_URL).rstrip("/")


def fake() -> bool:
    """e2e·CI: 엔진 없이 작은 그림을 만들어 흐름만 시험한다 (LLM_FAKE=1이면 함께 켜진다)."""
    return os.environ.get("IMAGE_FAKE") == "1" or os.environ.get("LLM_FAKE") == "1"


@dataclass(frozen=True)
class Family:
    """모델 계열마다 해상도·권장 설정이 다르다."""

    sizes: dict[str, tuple[int, int]]
    steps: int
    cfg: float
    quality: str
    negative: str
    # 수위 태그 (sfw는 하나, nsfw는 장면 설계표가 고른 단계 — 모델마다 쓰는 말이 다르다)
    ratings: dict[str, str]
    # SDXL 계열인가 (서버 안 엔진이 파이프라인 종류를 고른다)
    xl: bool = False


SDXL_ANIME = Family(
    # Animagine XL 4.0 권장 해상도·설정 (모델 카드)
    sizes={"정사각": (1024, 1024), "세로": (832, 1216), "가로": (1216, 832)},
    steps=28,
    cfg=5.0,
    quality="newest, masterpiece, high score, great score, absurdres",
    negative=(
        "lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, "
        "worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry, "
        "realistic, photorealistic, 3d, old, aged, wrinkles, sketch, monochrome, crowd, background people"
    ),
    # Animagine XL 4.0의 수위 태그 (모델 카드: safe / sensitive / nsfw / explicit)
    ratings={"safe": "safe", "sensitive": "sensitive", "nsfw": "nsfw", "explicit": "explicit"},
    xl=True,
)

SD15 = Family(
    sizes={"정사각": (512, 512), "세로": (512, 768), "가로": (768, 512)},
    steps=28,
    cfg=7.0,
    quality="masterpiece, best quality, highly detailed",
    negative="lowres, bad anatomy, bad hands, text, error, worst quality, low quality, blurry, watermark, signature, deformed",
    ratings={"safe": "", "sensitive": "", "nsfw": "nsfw", "explicit": "nsfw"},
)

# 전체 이용가(sfw)에 붙이는 안전 쪽 부정 프롬프트. 결과는 다시 그림 검수를 거친다
SAFETY_NEGATIVE = (
    "nsfw, nude, naked, nipples, sexual, explicit, underwear, lingerie, cleavage, swimsuit, bikini, revealing clothes, "
    "gore, blood, injury, violence, weapon, horror, child, loli, shota"
)
# 성인(nsfw)에서도 언제나 붙이는 부정 프롬프트: 어린 모습·강제·의식 없는 상대·동물
ADULT_NEGATIVE = (
    "child, loli, shota, flat chest, petite, school uniform, rape, forced, non-consensual, unconscious, sleeping, restrained, "
    "bestiality, animal"
)


@dataclass(frozen=True)
class Style:
    checkpoint_env: str
    checkpoint_default: str
    family: Family
    # 화풍을 정하는 영어 태그
    tags: str


STYLES: dict[str, Style] = {
    "애니메이션": Style("SD_ANIME_MODEL", "animagine-xl-4.0-opt.safetensors", SDXL_ANIME, "anime coloring, detailed eyes"),
    "웹툰": Style("SD_ANIME_MODEL", "animagine-xl-4.0-opt.safetensors", SDXL_ANIME, "webtoon, manhwa, clean lineart, flat color"),
    "수채화": Style("SD_BASE_MODEL", "v1-5-pruned-emaonly.safetensors", SD15, "watercolor painting, traditional media, soft colors"),
    "실사풍": Style("SD_BASE_MODEL", "v1-5-pruned-emaonly.safetensors", SD15, "photorealistic, cinematic lighting, realistic"),
}


def checkpoint(style: Style) -> str:
    return os.environ.get(style.checkpoint_env, style.checkpoint_default)


def engine() -> str:
    return "webui" if os.environ.get("IMAGE_ENGINE", "local").strip().lower() == "webui" else "local"


def status() -> dict:
    """엔진이 켜져 있고 쓰려는 체크포인트가 모두 있나. 짧게 묻고, 안 되면 준비 중으로 본다."""
    if fake():
        return {"ready": True, "missing": []}
    if engine() == "local":
        return image_local.status({checkpoint(s) for s in STYLES.values()})
    try:
        res = httpx.get(f"{_url()}/sdapi/v1/sd-models", timeout=3.0)
        res.raise_for_status()
        names = {m.get("model_name", "") for m in res.json()} | {
            os.path.basename(m.get("filename", "")) for m in res.json()
        }
    except (httpx.HTTPError, ValueError):
        return {"ready": False, "missing": []}
    wanted = {checkpoint(s) for s in STYLES.values()}
    # model_name은 확장자 없는 이름, filename은 전체 경로 — 둘 중 하나라도 맞으면 있다
    missing = sorted(w for w in wanted if w not in names and os.path.splitext(w)[0] not in names)
    return {"ready": not missing, "missing": missing}


def _fake_png(width: int, height: int) -> bytes:
    from PIL import Image

    image = Image.new("RGB", (width // 16, height // 16), (180, 150, 255))
    for x in range(image.width):
        for y in range(image.height):
            image.putpixel((x, y), (120 + x * 4 % 120, 100 + y * 5 % 140, 230))
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def txt2img(*, prompt: str, negative: str, style: Style, ratio: str) -> tuple[bytes, int, int]:
    """그림 한 장(PNG 바이트)과 크기. 엔진이 없거나 실패하면 503/502."""
    width, height = style.family.sizes[ratio]
    if fake():
        return _fake_png(width, height), width, height
    if engine() == "local":
        png = image_local.txt2img(
            prompt=prompt,
            negative=negative,
            checkpoint=checkpoint(style),
            xl=style.family.xl,
            width=width,
            height=height,
            steps=style.family.steps,
            cfg=style.family.cfg,
        )
        return png, width, height
    payload = {
        "prompt": prompt,
        "negative_prompt": negative,
        "width": width,
        "height": height,
        "steps": style.family.steps,
        "cfg_scale": style.family.cfg,
        "sampler_name": "Euler a",
        "seed": -1,
        "batch_size": 1,
        "n_iter": 1,
        # 요청마다 체크포인트를 못 박는다. 바꾼 뒤 되돌리지 않아 같은 화풍을 연달아 쓰면 다시 읽지 않는다
        "override_settings": {"sd_model_checkpoint": checkpoint(style)},
        "override_settings_restore_afterwards": False,
        "send_images": True,
        "save_images": False,
    }
    try:
        # 체크포인트를 바꾸면 처음 한 번은 다시 읽느라 2~3분 걸린다 (Nest는 300초 기다린다)
        res = httpx.post(f"{_url()}/sdapi/v1/txt2img", json=payload, timeout=290.0)
        res.raise_for_status()
        images = res.json().get("images") or []
    except httpx.ConnectError as exc:
        raise HTTPException(status_code=503, detail="그림 엔진(Stable Diffusion WebUI)이 꺼져 있어요.") from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="그림을 만드는 데 너무 오래 걸려 멈췄어요.") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="그림 엔진이 그림을 만들지 못했어요.") from exc
    if not images:
        raise HTTPException(status_code=502, detail="그림 엔진이 빈 결과를 돌려줬어요.")
    return base64.b64decode(images[0]), width, height
