from fastapi import APIRouter

from app.orchestration import meta

router = APIRouter(tags=["health"])


@router.get("/health")
def check() -> dict[str, str]:
    return meta.health()
