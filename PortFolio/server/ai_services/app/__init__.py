"""포트폴리오 AI 서비스 (Flask).

    GET  /health        상태: 자료 수, 모델, Ollama 연결
    GET  /graph         LangGraph 구조(mermaid)
    POST /chat          {message, history:[{role, content}]} → {answer, sources, steps, model}

Rails가 앞에서 부르는 내부 서비스다. AI_INTERNAL_TOKEN이 있으면 X-Internal-Token 헤더가 맞는 요청만 받는다.
"""

from __future__ import annotations

import hmac
import time

import httpx
from flask import Flask, jsonify, request
from flask_cors import CORS
from langchain_ollama import ChatOllama

from .config import Settings, load_settings
from .graph import MERMAID, build_graph
from .rag import KnowledgeBase

MAX_MESSAGE = 1000
MAX_HISTORY = 20


def create_app(settings: Settings | None = None, llm_for=None) -> Flask:
    s = settings or load_settings()
    app = Flask(__name__)
    CORS(app, origins=s.allowed_origins)
    kb = KnowledgeBase(s.knowledge_dir, top_k=s.top_k)

    def default_llm(model: str):
        # reasoning=False: gemma4의 생각(thinking) 출력을 끈다. 켜 두면 답 길이 상한을 생각에 다 써 빈 답이 나온다(2026-11-07 실측)
        # num_predict: 답 길이 상한(작은 PC에서 한 번에 수 분 걸리지 않게)
        return ChatOllama(
            model=model,
            base_url=s.ollama_base_url,
            temperature=s.temperature,
            num_ctx=8192,
            num_predict=900,
            reasoning=False,
            client_kwargs={"timeout": s.request_timeout},
        )

    graph = build_graph(kb, llm_for or default_llm, s.chat_model, s.fallback_model, s.min_score)

    @app.before_request
    def check_token():
        if not s.internal_token or request.path == "/health":
            return None
        given = request.headers.get("X-Internal-Token", "")
        if not hmac.compare_digest(given, s.internal_token):
            return jsonify(error="unauthorized"), 401
        return None

    @app.get("/health")
    def health():
        try:
            tags = httpx.get(f"{s.ollama_base_url}/api/tags", timeout=3).json().get("models", [])
            names = [m["name"] for m in tags]
            ollama = {"reachable": True, "chatModel": s.chat_model in names, "fallbackModel": s.fallback_model in names}
        except Exception:
            ollama = {"reachable": False, "chatModel": False, "fallbackModel": False}
        return jsonify(status="ok", service="portfolio-ai", chunks=len(kb.docs), sources=len(kb.sources), model=s.chat_model, fallback=s.fallback_model, ollama=ollama)

    @app.get("/graph")
    def graph_shape():
        return jsonify(mermaid=MERMAID, nodes=["route", "greeting", "condense", "retrieve", "grade", "generate", "no_context"])

    @app.post("/chat")
    def chat():
        body = request.get_json(silent=True) or {}
        message = str(body.get("message", "")).strip()
        if not message:
            return jsonify(error="message가 비었어요."), 400
        if len(message) > MAX_MESSAGE:
            return jsonify(error=f"질문은 {MAX_MESSAGE}자까지예요."), 400
        history = [
            {"role": t.get("role"), "content": str(t.get("content", ""))[:2000]}
            for t in (body.get("history") or [])[-MAX_HISTORY:]
            if isinstance(t, dict) and t.get("role") in ("user", "assistant")
        ]
        t0 = time.perf_counter()
        try:
            out = graph.invoke({"question": message, "history": history, "steps": []})
        except RuntimeError as e:
            return jsonify(error="대화 모델이 응답하지 않아요. 잠시 뒤 다시 시도해 주세요.", detail=str(e)[:200]), 503
        return jsonify(
            answer=out["answer"],
            sources=out.get("sources", []),
            steps=out.get("steps", []),
            model=out.get("model", ""),
            standalone=out.get("standalone", message),
            ms=round((time.perf_counter() - t0) * 1000),
        )

    return app
