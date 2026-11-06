# FastAPI + 서버 안 그림 엔진 (NVIDIA GPU). 모델 가중치는 이미지에 넣지 않고 볼륨으로 붙인다
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 HF_HOME=/cache/huggingface SD_MODEL_DIR=/models
WORKDIR /srv
COPY services/ai/requirements.txt services/ai/requirements-image.txt ./
# WITH_IMAGE=0이면 그림 엔진(torch·diffusers, 수 GB)을 빼고 만든다. GPU 없는 서버(Oracle 무료 ARM)에서 대화만 돌릴 때.
# 그림 엔진이 없으면 코디포토넷·웹툰·AI 초상은 "준비 중"으로 잠기고 나머지는 돈다
ARG WITH_IMAGE=1
RUN pip install -r requirements.txt && if [ "$WITH_IMAGE" = "1" ]; then pip install -r requirements-image.txt; fi
COPY services/ai/app app
RUN useradd --create-home app && mkdir -p /cache/huggingface && chown -R app:app /cache
USER app
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
