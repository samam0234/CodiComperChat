from fastapi import APIRouter

from app.orchestration import chat
from app.schemas.chat.rewrite import RewriteRequest, RewriteResponse

router = APIRouter(tags=["rewrite"])


@router.post("/rewrite-line", response_model=RewriteResponse)
def rewrite_line(request: RewriteRequest) -> RewriteResponse:
    return chat.rewrite_line(request)
