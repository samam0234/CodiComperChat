"""사용 안내 챗봇. 범용 비서가 되지 않게 범위는 assist 모듈이 묶는다."""

from app.services.guide import assist
from app.schemas.guide.assist import AssistRequest, AssistResponse


def reply(request: AssistRequest) -> AssistResponse:
    return assist.run(request)
