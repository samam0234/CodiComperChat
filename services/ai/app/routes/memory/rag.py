from fastapi import APIRouter

from app.orchestration import memory
from app.schemas.memory.rag import RagHit, RagQuery, RagReplace, RagReplaceResult

router = APIRouter(tags=["rag"])


@router.post("/rag/query", response_model=RagHit)
def rag_query(request: RagQuery) -> RagHit:
    return memory.query(request)


@router.post("/rag/personal", response_model=RagReplaceResult)
def rag_replace(request: RagReplace) -> RagReplaceResult:
    return memory.replace(request)
