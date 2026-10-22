from fastapi import APIRouter

from app.schemas.assist import AssistRequest, AssistResponse
from app.services import assist

router = APIRouter(tags=["assist"])


@router.post("/assist", response_model=AssistResponse)
def assist_chat(request: AssistRequest) -> AssistResponse:
    return assist.run(request)
