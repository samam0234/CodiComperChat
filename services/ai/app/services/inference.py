from typing import NoReturn

from fastapi import HTTPException


def run() -> NoReturn:
    raise HTTPException(
        status_code=501,
        detail=(
            "추론은 아직 구현되지 않았다. 이미 조립된 컨텍스트 + 유저 턴을 받아 "
            "캐릭터 에이전트 응답을 스트림으로 돌려주는 자리다 "
            "(기획서 7.6장·13.2장). 호스티드 LLM 벤더는 아직 미정이다."
        ),
    )
