from fastapi import APIRouter

from app.orchestration import chat
from app.schemas.chat.summarize import SummarizeRequest, SummarizeResponse

router = APIRouter(tags=["summarize"])


@router.post("/summarize", response_model=SummarizeResponse)
def summarize(request: SummarizeRequest) -> SummarizeResponse:
    return chat.summarize(request)
