"""월드 한 턴의 순서. 진행자 답과 파트 판정은 서로 다른 입구다."""

from app.services.world import world
from app.schemas.world.wire import PartCheckRequest, PartCheckResponse, WorldTurnRequest, WorldTurnResponse


def turn(request: WorldTurnRequest) -> WorldTurnResponse:
    return world.turn(request)


def part_check(request: PartCheckRequest) -> PartCheckResponse:
    return world.part_check(request)
