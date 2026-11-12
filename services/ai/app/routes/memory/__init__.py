"""기억 벡터 라우트."""

from fastapi import APIRouter

from app.routes.memory.rag import router as rag_router

router = APIRouter()
router.include_router(rag_router)
