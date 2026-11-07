# Oracle A1(ARM, GPU 없음)용 FastAPI. 그림 엔진(torch·diffusers)은 넣지 않는다 → 그림 기능은 "준비 중"으로 잠긴다.
# GPU 서버용은 deploy/ai.Dockerfile (requirements-image.txt까지 설치).
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /srv
COPY services/ai/requirements.txt ./
RUN pip install -r requirements.txt
COPY services/ai/app app
RUN useradd --create-home app
USER app
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
