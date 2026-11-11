"""환경변수 한 곳에서 읽기. 기본값은 로컬 개발(Ollama가 이 PC에서 도는 경우)."""

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    ollama_base_url: str
    chat_model: str
    fallback_model: str
    temperature: float
    top_k: int
    min_score: float
    # 속도: CPU 서버에서 입력 처리는 초당 약 13토큰, 답 생성은 약 5토큰이라 "자료 길이"와 "답 길이"가 곧 시간이다(2026-11-11 실측)
    context_hits: int
    context_chars: int
    num_predict: int
    cache_size: int
    cache_ttl: float
    cache_file: str
    num_ctx: int
    knowledge_dir: Path
    internal_token: str
    request_timeout: float
    allowed_origins: list[str]


def load_settings() -> Settings:
    here = Path(__file__).resolve().parents[1]
    return Settings(
        ollama_base_url=os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434"),
        # 챗봇은 Ollama gemma4:e4b 하나만 쓴다. 예비도 같은 모델이라 다른 모델을 고르지 않는다.
        chat_model=os.environ.get("CHAT_MODEL", "gemma4:e4b"),
        fallback_model=os.environ.get("FALLBACK_MODEL", "gemma4:e4b"),
        temperature=float(os.environ.get("CHAT_TEMPERATURE", "0.3")),
        top_k=int(os.environ.get("RAG_TOP_K", "10")),
        min_score=float(os.environ.get("RAG_MIN_SCORE", "1.5")),
        context_hits=int(os.environ.get("RAG_CONTEXT_HITS", "2")),
        context_chars=int(os.environ.get("RAG_CONTEXT_CHARS", "320")),
        num_predict=int(os.environ.get("CHAT_NUM_PREDICT", "260")),
        cache_size=int(os.environ.get("ANSWER_CACHE_SIZE", "64")),
        cache_ttl=float(os.environ.get("ANSWER_CACHE_TTL_SECONDS", "86400")),
        # 비우면 답 캐시를 메모리에만 둔다. 파일을 주면 재시작해도 남는다(자료가 바뀌면 지문이 달라 버려진다)
        cache_file=os.environ.get("ANSWER_CACHE_FILE", ""),
        # 0이면 정하지 않는다 = Ollama 기본값. 같은 Ollama를 쓰는 제품 AI와 값이 다르면 서로 부를 때마다 모델을 다시 올려 100초 넘게 걸린다(2026-11-11 실측)
        num_ctx=int(os.environ.get("CHAT_NUM_CTX", "0")),
        knowledge_dir=Path(os.environ.get("KNOWLEDGE_DIR", here / "knowledge")),
        # Rails가 붙이는 내부 토큰. 비우면 검사하지 않는다(로컬 개발)
        internal_token=os.environ.get("AI_INTERNAL_TOKEN", ""),
        request_timeout=float(os.environ.get("OLLAMA_TIMEOUT_SECONDS", "180")),
        allowed_origins=[o for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:4321").split(",") if o],
    )
