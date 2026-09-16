from fastapi import APIRouter

from app.schemas.infer import InferRequest, InferResponse
from app.services import inference

router = APIRouter(tags=["infer"])


@router.post("/infer", response_model=InferResponse)
def infer(request: InferRequest) -> InferResponse:
    return inference.run(request)
