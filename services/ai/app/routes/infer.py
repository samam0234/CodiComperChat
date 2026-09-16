from typing import NoReturn

from fastapi import APIRouter

from app.schemas.infer import InferRequest
from app.services import inference

router = APIRouter(tags=["infer"])


@router.post("/infer", response_model=None)
def infer(request: InferRequest) -> NoReturn:
    inference.run(request)
