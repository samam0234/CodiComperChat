"""대화 라우트."""

from fastapi import APIRouter

from app.routes.chat.ground import router as ground_router
from app.routes.chat.infer import router as infer_router
from app.routes.chat.remember import router as remember_router
from app.routes.chat.rewrite import router as rewrite_router
from app.routes.chat.suggest import router as suggest_router
from app.routes.chat.summarize import router as summarize_router

router = APIRouter()
router.include_router(infer_router)
router.include_router(suggest_router)
router.include_router(rewrite_router)
router.include_router(ground_router)
router.include_router(remember_router)
router.include_router(summarize_router)
