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
        knowledge_dir=Path(os.environ.get("KNOWLEDGE_DIR", here / "knowledge")),
        # Rails가 붙이는 내부 토큰. 비우면 검사하지 않는다(로컬 개발)
        internal_token=os.environ.get("AI_INTERNAL_TOKEN", ""),
        request_timeout=float(os.environ.get("OLLAMA_TIMEOUT_SECONDS", "180")),
        allowed_origins=[o for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:4321").split(",") if o],
    )
