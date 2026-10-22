from fastapi import APIRouter

from app.schemas.draft import DraftFieldRequest, DraftFieldResponse
from app.services import draft

router = APIRouter(tags=["draft-field"])


@router.post("/draft-field", response_model=DraftFieldResponse)
def draft_field(request: DraftFieldRequest) -> DraftFieldResponse:
    return draft.draft_field(request)
