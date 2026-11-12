"""공방 요청의 순서. 칸 초안, 퀘스트 초안, 3턴 판정, 초상 만들기를 한 입구로 모은다."""

from app.services.studio import critique, draft, portrait
from app.schemas.studio.critique import CritiqueTestRequest, CritiqueTestResponse
from app.schemas.studio.draft import DraftFieldRequest, DraftFieldResponse, DraftQuestRequest, DraftQuestResponse
from app.schemas.studio.portrait import PortraitRequest, PortraitResponse


def field(request: DraftFieldRequest) -> DraftFieldResponse:
    return draft.draft_field(request)


def quest(request: DraftQuestRequest) -> DraftQuestResponse:
    return draft.draft_quest(request)


def test_turns(request: CritiqueTestRequest) -> CritiqueTestResponse:
    return critique.critique_three_turns(request)


def make_portrait(request: PortraitRequest) -> PortraitResponse:
    return portrait.create(request)
