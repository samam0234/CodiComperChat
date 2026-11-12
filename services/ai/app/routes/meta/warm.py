from fastapi import APIRouter

from app.orchestration import meta

router = APIRouter(tags=["health"])


@router.get("/warm")
def warm() -> dict[str, str]:
    return meta.poke_warm()
