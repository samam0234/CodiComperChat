"""상태·학습 차단 라우트."""

from fastapi import APIRouter

from app.routes.meta.health import router as health_router
from app.routes.meta.train import router as train_router

router = APIRouter()
router.include_router(health_router)
router.include_router(train_router)
