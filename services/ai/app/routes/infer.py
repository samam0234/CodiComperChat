from typing import NoReturn

from fastapi import APIRouter

from app.services import inference

router = APIRouter(tags=["infer"])


@router.post("/infer", response_model=None)
def infer() -> NoReturn:
    inference.run()
