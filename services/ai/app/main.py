from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

from app.routes import assist, critique_test, health, infer, remember, suggest, summarize, train

# 실행 위치·--env-file 유무와 상관없이 services/ai/.env를 읽는다. 이미 설정된 환경변수는 덮어쓰지 않는다
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(
    title="코디컴퍼챗 AI 서비스",
    description=(
        "캐릭터 연기·세션 요약 엔진. 내부망에서 Nest(apps/api)만 호출한다. "
        "웹은 이 서비스를 직접 호출하지 않는다."
    ),
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(infer.router)
app.include_router(assist.router)
app.include_router(suggest.router)
app.include_router(remember.router)
app.include_router(summarize.router)
app.include_router(critique_test.router)
app.include_router(train.router)
