from fastapi import APIRouter

from app.schemas.suggest import SuggestRequest, SuggestResponse
from app.services import suggestion

router = APIRouter(tags=["suggest"])


@router.post("/suggest-replies", response_model=SuggestResponse)
def suggest_replies(request: SuggestRequest) -> SuggestResponse:
    return suggestion.run(request)
