"""그림 요청의 순서. 설계 → 조립 → 엔진 → 검수는 각 모듈 안에 있고, 입구는 여기만 연다."""

from app.services.picture import image_moderation, photonet, webtoon
from app.schemas.picture.moderate import ModerateImageRequest, ModerateImageResponse
from app.schemas.picture.photonet import PhotonetRequest, PhotonetResponse, PhotonetStatus
from app.schemas.picture.webtoon import WebtoonPanelRequest, WebtoonPanelResponse, WebtoonPlanRequest, WebtoonPlanResponse


def status() -> PhotonetStatus:
    return photonet.status()


def scene(request: PhotonetRequest) -> PhotonetResponse:
    return photonet.create(request)


def plan(request: WebtoonPlanRequest) -> WebtoonPlanResponse:
    return webtoon.plan(request)


def panel(request: WebtoonPanelRequest) -> WebtoonPanelResponse:
    return webtoon.panel(request)


def moderate(request: ModerateImageRequest) -> ModerateImageResponse:
    return image_moderation.moderate(request)
