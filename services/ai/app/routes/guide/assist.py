from fastapi import APIRouter

from app.orchestration import guide
from app.schemas.guide.assist import AssistRequest, AssistResponse

router = APIRouter(tags=["assist"])


@router.post("/assist", response_model=AssistResponse)
def assist_chat(request: AssistRequest) -> AssistResponse:
    return guide.reply(request)
