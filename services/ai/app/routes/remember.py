from fastapi import APIRouter

from app.schemas.remember import RememberRequest, RememberResponse
from app.services import remember

router = APIRouter(tags=["remember"])


@router.post("/remember", response_model=RememberResponse)
def remember_turns(request: RememberRequest) -> RememberResponse:
    return remember.run(request)
