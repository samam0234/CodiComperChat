"""사용자별 기억과 공통 말투 자료를 ChromaDB에 담는다.

컬렉션은 둘이다. personal은 userId·characterId가 같은 기억만 돌려준다.
common은 저장소의 공통 말투 JSON이다. 임베딩은 rag_embed가 로컬에서 만든다.
"""

from __future__ import annotations

import json
import os
import threading
from pathlib import Path

from app.modules.memory.rag_embed import embed, preprocess, profile

COMMON_PATH = Path(__file__).resolve().parents[2] / "data" / "common_language.json"
# 코사인 거리. 이보다 먼 조각은 이번 말과 관계없다고 보고 프롬프트에 넣지 않는다.
MAX_DISTANCE = 0.72
PERSONAL_K = 4
COMMON_K = 1


_client_cache = None
_client_path: str | None = None
# 서버가 켜질 때 공통 말투를 넣는 스레드와 Nest 요청이 같은 저장소를 동시에 열지 않게 한다.
_lock = threading.RLock()


def chroma_dir() -> Path:
    raw = os.environ.get("CHROMA_DIR", "").strip()
    path = Path(raw) if raw else Path(__file__).resolve().parents[2] / "data" / "ChromaDB"
    path.mkdir(parents=True, exist_ok=True)
    return path


def close_client() -> None:
    """시험이 임시 폴더를 지우기 전에 파일 잠금을 푼다."""
    global _client_cache, _client_path
    with _lock:
        _client_cache = None
        _client_path = None
        try:
            from chromadb.api.client import SharedSystemClient

            SharedSystemClient.clear_system_cache()
        except Exception:
            return


def _client():
    global _client_cache, _client_path
    with _lock:
        path = str(chroma_dir())
        if _client_cache is not None and _client_path == path:
            return _client_cache
        _client_cache = None
        _client_path = None
        import chromadb

        _client_cache = chromadb.PersistentClient(path=path)
        _client_path = path
        return _client_cache


def _collection(name: str):
    return _client().get_or_create_collection(name=name, metadata={"hnsw:space": "cosine"})


def common_documents() -> list[dict[str, str]]:
    rows = json.loads(COMMON_PATH.read_text(encoding="utf-8"))
    documents = []
    for row in rows:
        text = preprocess(row["text"])
        if len(text) < 4:
            continue
        documents.append({"id": row["id"], "topic": row["topic"], "text": text})
    return documents


def index_common() -> dict[str, float]:
    with _lock:
        return _index_common()


def _index_common() -> dict[str, float]:
    documents = common_documents()
    collection = _collection("common")
    if documents:
        collection.upsert(
            ids=[row["id"] for row in documents],
            documents=[row["text"] for row in documents],
            embeddings=[embed(row["text"]) for row in documents],
            metadatas=[{"topic": row["topic"]} for row in documents],
        )
    return profile([row["text"] for row in documents])


def replace_personal(user_id: str, character_id: str, items: list[dict[str, str]]) -> int:
    with _lock:
        return _replace_personal(user_id, character_id, items)


def _replace_personal(user_id: str, character_id: str, items: list[dict[str, str]]) -> int:
    collection = _collection("personal")
    where = {"$and": [{"userId": user_id}, {"characterId": character_id}]}
    try:
        collection.delete(where=where)
    except Exception:
        pass
    kept = []
    for item in items:
        text = preprocess(item.get("text", ""))
        item_id = item.get("id", "").strip()
        if item_id and len(text) >= 4:
            kept.append({"id": item_id, "text": text})
    if not kept:
        return 0
    collection.upsert(
        ids=[row["id"] for row in kept],
        documents=[row["text"] for row in kept],
        embeddings=[embed(row["text"]) for row in kept],
        metadatas=[{"userId": user_id, "characterId": character_id} for _ in kept],
    )
    return len(kept)


def _hits(result: dict, limit: int) -> list[str]:
    docs = (result.get("documents") or [[]])[0]
    distances = (result.get("distances") or [[]])[0]
    chosen: list[str] = []
    for text, distance in zip(docs, distances):
        if text and distance is not None and distance <= MAX_DISTANCE:
            chosen.append(text)
        if len(chosen) >= limit:
            break
    return chosen


def _safe_query(collection, **kwargs) -> dict:
    try:
        return collection.query(**kwargs)
    except Exception:
        return {"documents": [[]], "distances": [[]]}


def query(user_id: str, character_id: str, text: str) -> dict[str, list[str]]:
    with _lock:
        return _query(user_id, character_id, text)


def _query(user_id: str, character_id: str, text: str) -> dict[str, list[str]]:
    probe = embed(text)
    personal = _safe_query(
        _collection("personal"),
        query_embeddings=[probe],
        n_results=PERSONAL_K,
        where={"$and": [{"userId": user_id}, {"characterId": character_id}]},
        include=["documents", "distances"],
    )
    common = _safe_query(
        _collection("common"),
        query_embeddings=[probe],
        n_results=COMMON_K,
        include=["documents", "distances"],
    )
    return {"personal": _hits(personal, PERSONAL_K), "common": _hits(common, COMMON_K)}
