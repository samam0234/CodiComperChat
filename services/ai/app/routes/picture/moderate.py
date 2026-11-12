from fastapi import APIRouter

from app.orchestration import picture
from app.schemas.picture.moderate import ModerateImageRequest, ModerateImageResponse

router = APIRouter(tags=["moderate-image"])


@router.post("/moderate-image", response_model=ModerateImageResponse)
def moderate_image(request: ModerateImageRequest) -> ModerateImageResponse:
    return picture.moderate(request)
