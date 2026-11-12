from fastapi import APIRouter

from app.orchestration import chat
from app.schemas.chat.suggest import SuggestRequest, SuggestResponse

router = APIRouter(tags=["suggest"])


@router.post("/suggest-replies", response_model=SuggestResponse)
def suggest_replies(request: SuggestRequest) -> SuggestResponse:
    return chat.suggest(request)
