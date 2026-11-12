"""대화 검색용 로컬 임베딩.

추론 모델을 부르지 않는다. 한국어 글자 2-gram을 해시해 고정 길이 벡터로 만든다.
같은 말이면 같은 벡터고, 겹치는 글자가 많을수록 가깝다. 가중치 학습은 하지 않는다.
"""

from __future__ import annotations

import math
import re
import unicodedata
import zlib

DIM = 128
RUN = re.compile(r"[가-힣a-z0-9]+")
MAX_CHARS = 200


def preprocess(text: str) -> str:
    """NFC로 맞추고 공백을 한 칸으로 줄인다. 너무 긴 기억은 앞에서 자른다."""
    collapsed = re.sub(r"\s+", " ", unicodedata.normalize("NFC", text)).strip().lower()
    return collapsed[:MAX_CHARS]


def profile(texts: list[str]) -> dict[str, float]:
    """묶음의 길이 분포. 공통 자료가 프롬프트를 늘리지 않는지 볼 때 쓴다."""
    lengths = [len(preprocess(text)) for text in texts]
    if not lengths:
        return {"count": 0, "mean": 0, "max": 0, "empty": 0}
    empty = sum(1 for n in lengths if n < 4)
    return {
        "count": float(len(lengths)),
        "mean": sum(lengths) / len(lengths),
        "max": float(max(lengths)),
        "empty": float(empty),
    }


def _bigrams(text: str) -> list[str]:
    grams: list[str] = []
    for run in RUN.findall(text):
        if len(run) == 1:
            grams.append(run)
            continue
        grams.extend(run[i : i + 2] for i in range(len(run) - 1))
    return grams


def embed(text: str) -> list[float]:
    vec = [0.0] * DIM
    for gram in _bigrams(preprocess(text)):
        hashed = zlib.crc32(gram.encode())
        vec[hashed % DIM] += 1.0 if (hashed // DIM) % 2 == 0 else -1.0
    norm = math.sqrt(sum(value * value for value in vec))
    if norm == 0:
        return vec
    return [value / norm for value in vec]


def cosine(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right))
