from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

from app import request_priority
from app.internal_auth import assert_production_safety, internal_auth
from app.orchestration import meta
from app.routes.chat import router as chat_router
from app.routes.guide import router as guide_router
from app.routes.memory import router as memory_router
from app.routes.meta import router as meta_router
from app.routes.ops import router as ops_router
from app.routes.picture import router as picture_router
from app.routes.studio import router as studio_router
from app.routes.world import router as world_router

# 실행 위치·--env-file 유무와 상관없이 services/ai/.env를 읽는다. 이미 설정된 환경변수는 덮어쓰지 않는다
load_dotenv(Path(__file__).resolve().parents[1] / ".env")
assert_production_safety()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # 대화 모델 예열과 공통 말투 색인. 기다리는 답보다 먼저 서버를 연다
    meta.start_background()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="코디컴퍼챗 AI 서비스",
    description=(
        "캐릭터 연기·세션 요약 엔진. 내부망에서 Nest(apps/api)만 호출한다. "
        "웹은 이 서비스를 직접 호출하지 않는다."
    ),
    version="0.1.0",
)

app.middleware("http")(internal_auth)


# Nest가 보낸 우선순위(foreground·background)를 이 요청 동안 기억한다. 배경 작업은 CPU 예비로 내려가지 않는다
@app.middleware("http")
async def remember_priority(request, call_next):
    request_priority.set_priority(request.headers.get(request_priority.HEADER))
    return await call_next(request)

app.include_router(meta_router)
app.include_router(chat_router)
app.include_router(memory_router)
app.include_router(picture_router)
app.include_router(studio_router)
app.include_router(ops_router)
app.include_router(world_router)
app.include_router(guide_router)
