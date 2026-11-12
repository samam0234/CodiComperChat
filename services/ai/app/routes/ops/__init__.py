"""오퍼레이션 라우트."""

from fastapi import APIRouter

from app.routes.ops.operations import router as operations_router

router = APIRouter()
router.include_router(operations_router)
