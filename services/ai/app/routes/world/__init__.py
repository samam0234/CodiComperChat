"""월드 라우트."""

from fastapi import APIRouter

from app.routes.world.world import router as world_router

router = APIRouter()
router.include_router(world_router)
