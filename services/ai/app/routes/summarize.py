from fastapi import APIRouter

from app.schemas.summarize import SummarizeRequest, SummarizeResponse
from app.services import summarization

router = APIRouter(tags=["summarize"])


@router.post("/summarize", response_model=SummarizeResponse)
def summarize(request: SummarizeRequest) -> SummarizeResponse:
    return summarization.summarize_session(request)
