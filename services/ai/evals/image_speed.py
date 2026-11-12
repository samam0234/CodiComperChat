"""그림 한 장이 어느 단계에서 시간을 쓰는지 잰다 (실제 그림 엔진·실제 모델).

    cd services/ai
    .venv/Scripts/python.exe -m evals.image_speed

대화 모델이 그래픽 메모리에 있을 때 / 내려 뒀을 때를 나눠 잰다. 결과는 docs/guidance/photonet-engine.md에 적는다.
"""

import json
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.modules.picture import image_engine
from app.services.picture import photonet
from app.modules.runtime import llm  # noqa: E402

PROMPT = "1girl, short hair, apron, indoors, cafe, looking at viewer, upper body"


def timed(label: str, work):
    start = time.perf_counter()
    result = work()
    print(f"{label}: {time.perf_counter() - start:.1f}초", flush=True)
    return result


def draw(style_name: str):
    style = image_engine.STYLES[style_name]
    return image_engine.txt2img(prompt=f"{style.tags}, {PROMPT}", negative=photonet.negative_for(style, "sfw"), style=style, ratio="정사각")


def main() -> int:
    if not image_engine.status().get("ready"):
        print(f"그림 엔진이 준비되지 않았다: {json.dumps(image_engine.status(), ensure_ascii=False)}")
        return 1
    timed("대화 모델 올리기(그래픽 메모리 차지)", lambda: llm.generate(system="짧게 답한다", contents=[llm.turn("user", "안녕")], max_output_tokens=8))
    png = timed("첫 장(체크포인트 읽기 포함)", lambda: draw("애니메이션"))[0]
    # 실제 흐름: 그리고 → 검수하고 → 다음 컷을 그린다
    for index in range(2, 5):
        timed("그림 검수", lambda: photonet._check(png, "sfw"))
        timed(f"{index}장째", lambda: draw("애니메이션"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
