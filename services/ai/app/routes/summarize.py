from typing import NoReturn

from fastapi import APIRouter

from app.services import summarization

router = APIRouter(tags=["summarize"])


@router.post("/summarize", response_model=None)
def summarize() -> NoReturn:
    summarization.summarize_session()
