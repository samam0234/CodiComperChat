from fastapi import APIRouter

from app.schemas.rewrite import RewriteRequest, RewriteResponse
from app.services import rewrite

router = APIRouter(tags=["rewrite"])


@router.post("/rewrite-line", response_model=RewriteResponse)
def rewrite_line(request: RewriteRequest) -> RewriteResponse:
    return rewrite.run(request)
