"""그림 라우트."""

from fastapi import APIRouter

from app.routes.picture.moderate import router as moderate_router
from app.routes.picture.photonet import router as photonet_router
from app.routes.picture.webtoon import router as webtoon_router

router = APIRouter()
router.include_router(photonet_router)
router.include_router(webtoon_router)
router.include_router(moderate_router)
