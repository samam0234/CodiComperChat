from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.orchestration import chat
from app.schemas.chat.infer import InferRequest, InferResponse

router = APIRouter(tags=["infer"])


@router.post("/infer", response_model=InferResponse)
def infer(request: InferRequest) -> InferResponse:
    return chat.reply(request)


@router.post("/infer/stream")
def infer_stream(request: InferRequest) -> StreamingResponse:
    return StreamingResponse(chat.stream(request), media_type="application/x-ndjson")
