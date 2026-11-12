from fastapi import APIRouter

from app.orchestration import chat
from app.schemas.chat.ground import GroundCheckRequest, GroundCheckResponse

router = APIRouter(tags=["ground-check"])


@router.post("/ground-check", response_model=GroundCheckResponse)
def ground_check(request: GroundCheckRequest) -> GroundCheckResponse:
    return chat.ground(request)
