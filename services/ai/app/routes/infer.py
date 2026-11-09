import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.infer import InferRequest, InferResponse
from app.services import inference

router = APIRouter(tags=["infer"])


@router.post("/infer", response_model=InferResponse)
def infer(request: InferRequest) -> InferResponse:
    return inference.run(request)


@router.post("/infer/stream")
def infer_stream(request: InferRequest) -> StreamingResponse:
    def body():
        try:
            yield from inference.iter_ndjson(request)
        except HTTPException as exc:
            detail = exc.detail if isinstance(exc.detail, str) else "LLM 호출 실패"
            yield json.dumps({"error": detail, "status": exc.status_code}, ensure_ascii=False) + "\n"

    return StreamingResponse(body(), media_type="application/x-ndjson")
