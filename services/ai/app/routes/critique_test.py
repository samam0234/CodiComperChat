from typing import NoReturn

from fastapi import APIRouter

from app.schemas.critique import CritiqueTestRequest, CritiqueTestResponse
from app.services import critique

router = APIRouter(tags=["critique-test"])


@router.post("/critique-test", response_model=CritiqueTestResponse)
def critique_test(request: CritiqueTestRequest) -> NoReturn:
    critique.critique_three_turns(request)
