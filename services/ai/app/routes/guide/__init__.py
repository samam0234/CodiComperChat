"""사용 안내 라우트."""

from fastapi import APIRouter

from app.routes.guide.assist import router as assist_router

router = APIRouter()
router.include_router(assist_router)
