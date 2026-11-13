"""실제 Ollama로 첫 글자·완료 시간과 기억 회상을 함께 측정한다.

python -m evals.chat_latency --out evals/.results/chat-latency.json
실행 전 모델의 적재 상태를 기록한다. 첫 표본이 이미 적재된 모델이면 cold 측정으로 간주하지 않는다.
"""
import argparse
import json
import time
from pathlib import Path

import httpx

from app.schemas.chat.infer import InferRequest
from app.schemas.context import MemoryChunk, Turn
from app.services.chat import inference
from evals import fixture


def cases():
    opening = InferRequest(context=fixture.context(), user_turn="아메리카노 한 잔 주세요.")
    memory = fixture.context().model_copy(update={
        "recent_turns": [
            Turn(role="user", text="오늘도 카페가 조용하네요."),
            Turn(role="character", text="네, 따뜻한 커피 한 잔 드릴까요?"),
        ],
        "story_so_far": "민준과 지우는 금요일 오후 3시에 수선화 서점에서 만나기로 약속했다.",
        "retrieved_memories": [MemoryChunk(id="cat", text="민준이 키우는 고양이의 이름은 보리다.")],
    })
    return [
        ("opening", opening, []),
        ("memory", InferRequest(context=memory, user_turn="우리 만나기로 한 곳과 시간을 기억해요? 고양이 이름도요."), ["금요일", "수선화", "보리"]),
        ("followup", InferRequest(context=memory, user_turn="보리가 요즘 창가에서 낮잠을 자요."), []),
        ("scene", InferRequest(context=memory, user_turn="(카페 문을 닫고 서점 앞에 도착했다) 약속 기억해 줘서 고마워요. 지금 기분과 다음에 하고 싶은 일을 말해 줘요."), []),
    ]


def measure(base_url, name, request, expected):
    system, contents, model = inference._prompt(request)
    body = {
        "model": model,
        "messages": [{"role": "system", "content": system}, *contents],
        "stream": True,
        "think": False,
        "options": {"num_predict": inference.output_budget(request), "temperature": 0, "seed": 17},
    }
    started = time.monotonic()
    first = None
    pieces = []
    metrics = {}
    with httpx.stream("POST", f"{base_url}/api/chat", json=body, timeout=120) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if not line:
                continue
            chunk = json.loads(line)
            if chunk.get("error"):
                raise RuntimeError(chunk["error"])
            text = chunk.get("message", {}).get("content", "")
            if text:
                if first is None:
                    first = time.monotonic() - started
                pieces.append(text)
            if chunk.get("done"):
                metrics = chunk
                break
    answer = "".join(pieces)
    total = time.monotonic() - started
    target = 60 if name == "opening" else 30
    metric_keys = (
        "load_duration", "prompt_eval_count", "prompt_eval_duration",
        "eval_count", "eval_duration", "done_reason",
    )
    time_aliases = ("오후 3시", "오후 세 시", "오후 세시", "15시")
    result = {
        "case": name,
        "first_token_s": round(first, 3) if first is not None else None,
        "total_s": round(total, 3),
        "target_s": target,
        "within_target": bool(answer and metrics and total <= target),
        "complete": metrics.get("done_reason") == "stop",
        "time_recalled": name != "memory" or any(alias in answer for alias in time_aliases),
        "expected": expected,
        "found": {word: word in answer for word in expected},
        "answer": answer,
        "prompt_chars": len(system) + sum(len(str(turn["content"])) for turn in contents),
        "output_limit": inference.output_budget(request),
        "metrics": {key: metrics.get(key) for key in metric_keys},
    }
    print(json.dumps({k: v for k, v in result.items() if k not in ("answer", "metrics")}, ensure_ascii=False), flush=True)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:11434")
    parser.add_argument("--out", required=True)
    parser.add_argument("--repeat", type=int, default=1)
    args = parser.parse_args()
    if args.repeat < 1:
        parser.error("--repeat는 1 이상이어야 한다")
    before = httpx.get(f"{args.base_url}/api/ps", timeout=5).json()
    results = [measure(args.base_url, *case) for _ in range(args.repeat) for case in cases()]
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"loaded_before": before, "results": results}, ensure_ascii=False, indent=2), encoding="utf-8")
    passed = all(
        row["within_target"] and row["complete"] and row["time_recalled"] and all(row["found"].values())
        for row in results
    )
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
