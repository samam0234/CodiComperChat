from app.schemas.base import WireModel
from app.schemas.context import ContextSlice


class InferRequest(WireModel):
    context: ContextSlice
    user_turn: str
