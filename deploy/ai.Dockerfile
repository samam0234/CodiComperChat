# FastAPI + 서버 안 그림 엔진 (NVIDIA GPU). 모델 가중치는 이미지에 넣지 않고 볼륨으로 붙인다
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 HF_HOME=/cache/huggingface SD_MODEL_DIR=/models
WORKDIR /srv
COPY services/ai/requirements.txt services/ai/requirements-image.txt ./
RUN pip install -r requirements.txt -r requirements-image.txt
COPY services/ai/app app
RUN useradd --create-home app && mkdir -p /cache/huggingface && chown -R app:app /cache
USER app
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
