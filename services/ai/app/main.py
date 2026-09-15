from fastapi import FastAPI

from app.routes import critique_test, health, infer, summarize, train

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
app.include_router(summarize.router)
app.include_router(critique_test.router)
app.include_router(train.router)
