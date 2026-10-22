from fastapi import APIRouter

from app.schemas.moderate import ModerateImageRequest, ModerateImageResponse
from app.services import image_moderation

router = APIRouter(tags=["moderate-image"])


@router.post("/moderate-image", response_model=ModerateImageResponse)
def moderate_image(request: ModerateImageRequest) -> ModerateImageResponse:
    return image_moderation.moderate(request)
