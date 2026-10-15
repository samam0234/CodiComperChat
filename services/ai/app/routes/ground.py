from fastapi import APIRouter

from app.schemas.ground import GroundCheckRequest, GroundCheckResponse
from app.services import grounding

router = APIRouter(tags=["ground-check"])


@router.post("/ground-check", response_model=GroundCheckResponse)
def ground_check(request: GroundCheckRequest) -> GroundCheckResponse:
    return grounding.check(request)
