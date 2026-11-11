"""포트폴리오 AI 서비스 (Flask).

    GET  /health        상태: 자료 수, 모델, Ollama 연결
    GET  /graph         LangGraph 구조(mermaid)
    POST /chat          {message, history:[{role, content}]} → {answer, sources, steps, model}

Rails가 앞에서 부르는 내부 서비스다. AI_INTERNAL_TOKEN이 있으면 X-Internal-Token 헤더가 맞는 요청만 받는다.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from collections import OrderedDict

import httpx
from flask import Flask, jsonify, request
from flask_cors import CORS
from langchain_ollama import ChatOllama

from .config import Settings, load_settings
from .graph import MERMAID, SYSTEM, build_graph
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
        extra = {"num_ctx": s.num_ctx} if s.num_ctx > 0 else {}
        return ChatOllama(
            model=model,
            **extra,
            base_url=s.ollama_base_url,
            temperature=s.temperature,
            num_predict=s.num_predict,
            reasoning=False,
            client_kwargs={"timeout": s.request_timeout},
        )

    graph = build_graph(kb, llm_for or default_llm, s.chat_model, s.fallback_model, s.min_score, s.context_hits, s.context_chars)

    # 같은 질문(대화 기록 없음)은 모델을 다시 부르지 않고 바로 답한다. 방문자들이 같은 추천 질문을 자주 누른다
    cache: OrderedDict[str, tuple[float, dict]] = OrderedDict()
    # 자료·모델·프롬프트가 바뀌면 옛 답을 쓰지 않도록 지문을 둔다
    fingerprint = hashlib.sha1("\n".join([s.chat_model, SYSTEM, str((s.context_hits, s.context_chars, s.num_predict)), *[d.page_content for d in kb.docs]]).encode("utf-8")).hexdigest()[:16]

    def load_cache() -> None:
        if not s.cache_file or not os.path.exists(s.cache_file):
            return
        try:
            with open(s.cache_file, encoding="utf-8") as f:
                saved = json.load(f)
            if saved.get("fingerprint") == fingerprint:
                for k, payload in saved.get("items", {}).items():
                    cache[k] = (time.monotonic(), payload)
        except (OSError, ValueError):
            pass  # 캐시가 깨졌으면 없는 셈 친다

    def save_cache() -> None:
        if not s.cache_file:
            return
        try:
            tmp = s.cache_file + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump({"fingerprint": fingerprint, "items": {k: v[1] for k, v in cache.items()}}, f, ensure_ascii=False)
            os.replace(tmp, s.cache_file)
        except OSError:
            pass  # 못 써도 답은 이미 나갔다

    load_cache()

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
        key = " ".join(message.lower().split())
        use_cache = not history and s.cache_size > 0
        if use_cache and key in cache and time.monotonic() - cache[key][0] < s.cache_ttl:
            cache.move_to_end(key)
            return jsonify({**cache[key][1], "cached": True, "ms": round((time.perf_counter() - t0) * 1000)})
        try:
            out = graph.invoke({"question": message, "history": history, "steps": []})
        except RuntimeError as e:
            return jsonify(error="대화 모델이 응답하지 않아요. 잠시 뒤 다시 시도해 주세요.", detail=str(e)[:200]), 503
        payload = dict(
            answer=out["answer"],
            sources=out.get("sources", []),
            steps=out.get("steps", []),
            model=out.get("model", ""),
            standalone=out.get("standalone", message),
        )
        if use_cache and payload["model"] != "rule":  # 규칙 답(인사·근거 없음)은 원래 즉시라 담지 않는다
            cache[key] = (time.monotonic(), payload)
            while len(cache) > s.cache_size:
                cache.popitem(last=False)
            save_cache()
        return jsonify({**payload, "cached": False, "ms": round((time.perf_counter() - t0) * 1000)})

    return app
