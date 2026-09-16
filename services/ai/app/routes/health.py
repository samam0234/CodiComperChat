from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "ai",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
