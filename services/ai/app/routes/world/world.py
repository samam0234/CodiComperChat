from fastapi import APIRouter

from app.orchestration import world as world_flow
from app.schemas.world.wire import PartCheckRequest, PartCheckResponse, WorldTurnRequest, WorldTurnResponse

router = APIRouter(tags=["world"])


# 월드코퍼챗: 진행자가 여러 등장인물을 연기한 답 + 장면 그림 이름표 + 장소 이동
@router.post("/world/turn", response_model=WorldTurnResponse)
def world_turn(request: WorldTurnRequest) -> WorldTurnResponse:
    return world_flow.turn(request)


# 월드코퍼챗: 지금 파트의 목표가 이루어졌나 (근거 인용을 코드가 확인)
@router.post("/world/part-check", response_model=PartCheckResponse)
def world_part_check(request: PartCheckRequest) -> PartCheckResponse:
    return world_flow.part_check(request)
