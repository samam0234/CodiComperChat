from fastapi import APIRouter

from app.orchestration import studio
from app.schemas.studio.portrait import PortraitRequest, PortraitResponse

router = APIRouter(tags=["portrait"])


# 공방 초상 AI 만들기 (전체 이용가 그림 검수를 통과한 것만 돌려준다)
@router.post("/portrait", response_model=PortraitResponse)
def create(request: PortraitRequest) -> PortraitResponse:
    return studio.make_portrait(request)
