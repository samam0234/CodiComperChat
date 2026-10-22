from fastapi import APIRouter

from app.schemas.operations import MindRequest, MindResponse
from app.services import operations

router = APIRouter(tags=["operations"])


# 심리 탐구: 지금 장면에서 캐릭터의 속마음
@router.post("/mind", response_model=MindResponse)
def mind(request: MindRequest) -> MindResponse:
    return operations.mind(request)
