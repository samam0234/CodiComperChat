from fastapi import APIRouter

from app.orchestration import picture
from app.schemas.picture.webtoon import WebtoonPanelRequest, WebtoonPanelResponse, WebtoonPlanRequest, WebtoonPlanResponse

router = APIRouter(tags=["webtoon"])


# 웹툰 콘티: 컷마다 장면 설계표·해설·대사 (그림은 그리지 않는다)
@router.post("/webtoon/plan", response_model=WebtoonPlanResponse)
def plan(request: WebtoonPlanRequest) -> WebtoonPlanResponse:
    return picture.plan(request)


# 웹툰 한 컷 그리기 (검수를 통과한 그림만 돌려준다)
@router.post("/webtoon/panel", response_model=WebtoonPanelResponse)
def panel(request: WebtoonPanelRequest) -> WebtoonPanelResponse:
    return picture.panel(request)
