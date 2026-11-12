from fastapi import APIRouter

from app.orchestration import studio
from app.schemas.studio.critique import CritiqueTestRequest, CritiqueTestResponse

router = APIRouter(tags=["critique-test"])


@router.post("/critique-test", response_model=CritiqueTestResponse)
def critique_test(request: CritiqueTestRequest) -> CritiqueTestResponse:
    return studio.test_turns(request)
