# 포트폴리오 AI 서비스 (Flask + LangGraph). Ollama는 같은 compose의 ollama 서비스나 바깥 주소를 OLLAMA_BASE_URL로 가리킨다
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /srv
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app app
COPY knowledge knowledge
COPY run.py warm.py warm_questions.txt ./
RUN useradd --create-home app && mkdir /cache && chown app /cache
USER app
EXPOSE 5001
CMD ["waitress-serve", "--host=0.0.0.0", "--port=5001", "--threads=4", "--call", "app:create_app"]
