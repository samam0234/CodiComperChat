from fastapi import APIRouter

from app.schemas.operations import DiaryRequest, DiaryResponse, MindRequest, MindResponse
from app.services import operations

router = APIRouter(tags=["operations"])


# 심리 탐구: 지금 장면에서 캐릭터의 속마음
@router.post("/mind", response_model=MindResponse)
def mind(request: MindRequest) -> MindResponse:
    return operations.mind(request)


# 일기: 캐릭터가 자기 입장에서 최근 일을 돌아보는 일기
@router.post("/diary", response_model=DiaryResponse)
def diary(request: DiaryRequest) -> DiaryResponse:
    return operations.diary(request)
