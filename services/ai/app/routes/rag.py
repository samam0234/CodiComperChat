from fastapi import APIRouter, HTTPException

from app.schemas.rag import RagHit, RagQuery, RagReplace, RagReplaceResult
from app.services import chroma_rag

router = APIRouter(tags=["rag"])


def _unavailable(exc: Exception) -> HTTPException:
    return HTTPException(status_code=503, detail=f"벡터 저장소를 열지 못했습니다: {exc.__class__.__name__}")


@router.post("/rag/query", response_model=RagHit)
def rag_query(request: RagQuery) -> RagHit:
    try:
        hit = chroma_rag.query(request.user_id, request.character_id, request.text)
    except Exception as exc:
        raise _unavailable(exc) from exc
    return RagHit(personal=hit["personal"][:4], common=hit["common"][:1])


@router.post("/rag/personal", response_model=RagReplaceResult)
def rag_replace(request: RagReplace) -> RagReplaceResult:
    try:
        stored = chroma_rag.replace_personal(
            request.user_id,
            request.character_id,
            [item.model_dump() for item in request.items],
        )
    except Exception as exc:
        raise _unavailable(exc) from exc
    return RagReplaceResult(stored=stored)
