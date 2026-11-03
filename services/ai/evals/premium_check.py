"""프리미엄 모델 실제 호출 점검. 키를 넣은 뒤 사람이 돌린다 (돈이 아주 조금 든다). 답 내용과 키는 출력하지 않는다.

    python -m evals.premium_check claude-haiku-5-5 grok-4.5
"""

import sys
import time

from fastapi import HTTPException

from app.services import llm


def main(models: list[str]) -> int:
    failed = 0
    for model in models:
        provider = "xai" if model.startswith("grok") else "anthropic"
        started = time.monotonic()
        try:
            reply = llm.generate(
                system="한 문장으로 짧게 답한다.",
                contents=[llm.turn("user", "안녕하세요?")],
                max_output_tokens=100,
                model=model,
                provider=provider,
            )
            print(f"{model}: 통과, {time.monotonic() - started:.1f}초, 답 {len(reply)}자")
        except HTTPException as exc:
            failed += 1
            print(f"{model}: 실패 {exc.status_code} {exc.detail}")
    return 1 if failed else 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1:]))
