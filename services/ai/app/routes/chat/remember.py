from fastapi import APIRouter

from app.orchestration import chat
from app.schemas.chat.remember import RememberRequest, RememberResponse

router = APIRouter(tags=["remember"])


@router.post("/remember", response_model=RememberResponse)
def remember_turns(request: RememberRequest) -> RememberResponse:
    return chat.memorize(request)


@router.post("/notice-facts", response_model=RememberResponse)
def notice_facts(request: RememberRequest) -> RememberResponse:
    return chat.notice(request)
