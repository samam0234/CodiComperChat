from fastapi import APIRouter

from app.schemas.photonet import PhotonetRequest, PhotonetResponse, PhotonetStatus
from app.services import photonet

router = APIRouter(tags=["photonet"])


# 코디포토넷: 그림 엔진(Stable Diffusion WebUI)이 켜져 있고 쓰는 체크포인트가 다 있나
@router.get("/photonet/status", response_model=PhotonetStatus)
def photonet_status() -> PhotonetStatus:
    return photonet.status()


# 코디포토넷: 대화 장면을 그림으로 (검수를 통과한 그림만 돌려준다)
@router.post("/photonet", response_model=PhotonetResponse)
def create(request: PhotonetRequest) -> PhotonetResponse:
    return photonet.create(request)
