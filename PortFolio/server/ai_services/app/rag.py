"""RAG 자료 준비와 검색.

- 자료: knowledge/*.md (scripts/build_data.py가 저장소 문서·포트폴리오 콘텐츠·스프레드시트로 만든다)
- 나누기: LangChain MarkdownHeaderTextSplitter(제목 단위) → RecursiveCharacterTextSplitter(길이 단위)
- 검색: LangChain BM25Retriever + 한국어용 2-gram 토큰화
  코디컴퍼챗 본 서비스의 페르소나 지식 검색(apps/api/src/persona-rag)도 벡터 DB 없이 2-gram BM25를 썼다. 같은 판단을 이어 간다:
  한국어는 띄어쓰기·조사가 흔들려 단어 단위 BM25가 약하고, 글자 2-gram은 "퀘스트를"·"퀘스트" 같은 변형을 함께 잡는다.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from pathlib import Path

from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

_WORD = re.compile(r"[0-9A-Za-z_]+|[가-힣]+")
_STOP = {"그리고", "그래서", "하지만", "이것", "저것", "무엇", "어떻게", "있나요", "있어요", "합니다", "해요", "알려줘", "설명", "대해", "어때", "어떤", "뭐야", "뭔가요", "알려", "주세요", "궁금", "있어", "했어", "했나", "하나요", "인가요", "이야", "얼마나", "몇"}
# 질문은 한국어로, 문서는 영어 이름으로 적힌 경우가 많다
ALIASES = {"오라클": "oracle", "버셀": "vercel", "도커": "docker", "레일즈": "rails", "플라스크": "flask", "네스트": "nest", "넥스트": "next", "깃허브": "github", "프리즈마": "prisma", "올라마": "ollama", "젬마": "gemma", "랭체인": "langchain", "랭그래프": "langgraph", "캐디": "caddy"}
_VERB_END = re.compile(r"(었|았|였|했|렸|웠|겠|됐|나|니|냐|어|야|요|까|죠|래|줘|봐)$")
_PARTICLE_LONG = re.compile(r"(에서는|에서|으로|에게|까지|부터)$")
_PARTICLE = re.compile(r"(에서는|에서|으로|에게|까지|부터|이라|라는|하는|했나|했어|한다|에는|은|는|이|가|을|를|의|도|로|와|과|만|에)$")


def keywords(text: str) -> list[str]:
    """단어 단위 핵심어(조사 떼기, 한→영 별칭). 질문이 자료에 실제로 걸리는지 보는 데 쓴다."""
    out = []
    for w in _WORD.findall(text.lower()):
        if w in _STOP or len(w) < 2:
            continue
        if not w[0].isascii():
            if _VERB_END.search(w) and len(w) <= 4:
                continue  # "올렸나", "나눴어", "개야" 같은 서술어는 근거 판단에 쓰지 않는다
            # 한 글자 조사는 네 글자 이상일 때만 뗀다("고양이"의 '이'는 조사가 아니다). 세 글자는 비교할 때 끝 글자를 빼고도 본다
            stem = _PARTICLE.sub("", w) if (len(w) >= 4 or _PARTICLE_LONG.search(w)) else w
            w = stem if len(stem) >= 2 else w
            if w in _STOP:
                continue
        out.append(ALIASES.get(w, w))
    return list(dict.fromkeys(out))


def word_coverage(query_words: list[str], text: str) -> float:
    if not query_words:
        return 0.0
    low = text.lower()
    hit = 0
    for w in query_words:
        if w in low or (len(w) >= 3 and not w.isascii() and w[:-1] in low):
            hit += 1
    return hit / len(query_words)


def tokenize(text: str) -> list[str]:
    """영문·숫자는 단어 그대로(소문자), 한글은 2-gram. 한 글자 한글 단어는 그대로 둔다."""
    out: list[str] = []
    for w in _WORD.findall(text.lower()):
        if w in _STOP:
            continue
        if w[0].isascii():
            if len(w) > 1:
                out.append(w)
            continue
        if len(w) == 1:
            out.append(w)
            continue
        out.extend(w[i : i + 2] for i in range(len(w) - 1))
    return out


@dataclass
class Hit:
    doc: Document
    score: float
    coverage: float = 0.0  # 질문 핵심어 중 이 조각에 들어 있는 비율 (0~1)


class KnowledgeBase:
    def __init__(self, folder: Path, top_k: int = 6):
        self.folder = folder
        self.top_k = top_k
        self.docs = self._load(folder)
        self.retriever = BM25Retriever.from_documents(self.docs, preprocess_func=tokenize, k=top_k) if self.docs else None

    @staticmethod
    def _load(folder: Path) -> list[Document]:
        headers = [("#", "h1"), ("##", "h2"), ("###", "h3")]
        by_header = MarkdownHeaderTextSplitter(headers_to_split_on=headers, strip_headers=False)
        by_length = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=120, separators=["\n\n", "\n", ". ", " ", ""])
        docs: list[Document] = []
        for path in sorted(folder.glob("*.md")):
            text = path.read_text(encoding="utf-8")
            m = re.match(r"<!-- source: (.+?) -->", text)
            source = m.group(1) if m else path.name
            for section in by_header.split_text(text):
                heading = " > ".join(v for k, v in section.metadata.items() if k.startswith("h"))
                for k, chunk in enumerate(by_length.split_text(section.page_content)):
                    if len(chunk.strip()) < 40:
                        continue
                    # 긴 절을 나누면 뒤 조각에는 제목이 없다. 제목을 앞에 붙여 색인해야 "막힌 과정" 같은 절 제목으로도 찾힌다
                    body = chunk if k == 0 or not heading else f"[{heading}]\n{chunk}"
                    docs.append(Document(page_content=body, metadata={"source": source, "heading": heading}))
        return docs

    def search(self, query: str) -> list[Hit]:
        """BM25 점수를 함께 돌려준다(관련 없는 자료를 걸러 내는 데 쓴다)."""
        if not self.retriever:
            return []
        q = tokenize(query)
        if not q:
            return []
        scores = self.retriever.vectorizer.get_scores(q)
        ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[: self.top_k]
        words = keywords(query)
        hits = []
        for i in ranked:
            if scores[i] <= 0 or math.isnan(scores[i]):
                continue
            text = self.docs[i].page_content + " " + self.docs[i].metadata.get("heading", "") + " " + self.docs[i].metadata["source"]
            hits.append(Hit(self.docs[i], float(scores[i]), word_coverage(words, text)))
        return hits

    @property
    def sources(self) -> list[str]:
        return sorted({d.metadata["source"] for d in self.docs})
