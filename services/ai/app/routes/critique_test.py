from typing import NoReturn

from fastapi import APIRouter

from app.services import critique

router = APIRouter(tags=["critique-test"])


@router.post("/critique-test", response_model=None)
def critique_test() -> NoReturn:
    critique.critique_three_turns()
