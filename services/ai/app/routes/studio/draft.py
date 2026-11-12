from fastapi import APIRouter

from app.orchestration import studio
from app.schemas.studio.draft import DraftFieldRequest, DraftFieldResponse, DraftQuestRequest, DraftQuestResponse

router = APIRouter(tags=["draft-field"])


@router.post("/draft-field", response_model=DraftFieldResponse)
def draft_field(request: DraftFieldRequest) -> DraftFieldResponse:
    return studio.field(request)


@router.post("/draft-quest", response_model=DraftQuestResponse)
def draft_quest(request: DraftQuestRequest) -> DraftQuestResponse:
    return studio.quest(request)
