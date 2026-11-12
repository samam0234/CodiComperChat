"""공방 라우트."""

from fastapi import APIRouter

from app.routes.studio.critique_test import router as critique_router
from app.routes.studio.draft import router as draft_router
from app.routes.studio.portrait import router as portrait_router

router = APIRouter()
router.include_router(draft_router)
router.include_router(critique_router)
router.include_router(portrait_router)
