"""기억 벡터의 순서. 저장소를 열지 못하면 503이고, 대화 쪽은 글자 검색으로 돌아간다."""

from fastapi import HTTPException

from app.repositories.memory import chroma_rag
from app.schemas.memory.rag import RagHit, RagQuery, RagReplace, RagReplaceResult


def _unavailable(exc: Exception) -> HTTPException:
    return HTTPException(status_code=503, detail=f"벡터 저장소를 열지 못했습니다: {exc.__class__.__name__}")


def index_common() -> None:
    chroma_rag.index_common()


def query(request: RagQuery) -> RagHit:
    try:
        hit = chroma_rag.query(request.user_id, request.character_id, request.text)
    except Exception as exc:
        raise _unavailable(exc) from exc
    return RagHit(personal=hit["personal"][:4], common=hit["common"][:1])


def replace(request: RagReplace) -> RagReplaceResult:
    try:
        stored = chroma_rag.replace_personal(
            request.user_id,
            request.character_id,
            [item.model_dump() for item in request.items],
        )
    except Exception as exc:
        raise _unavailable(exc) from exc
    return RagReplaceResult(stored=stored)
