"""포트폴리오 가이드 챗봇의 LangGraph.

    route ─┬─ greeting ─────────────────────────────▶ END   (인사·자기소개: 모델 없이 즉시)
           └─ project ─▶ condense ─▶ retrieve ─▶ grade ─┬─▶ generate ─▶ END
                                                        └─▶ no_context ─▶ END   (근거가 없으면 지어내지 않는다)

- condense: 대화 기록이 있고 질문이 앞말에 기대면("그거", "왜?") LLM이 독립 질문으로 다시 쓴다(검색 품질용)
- grade: BM25 점수가 기준 미만인 조각을 버리고, 같은 문서·제목의 중복을 없앤다
- generate: LangChain LCEL(프롬프트 | 채팅 모델 | 문자열)로 근거 번호 [n]를 달아 답한다. 주 모델이 안 되면 예비 모델
"""

from __future__ import annotations

import re
import time
from typing import Callable, Literal, TypedDict

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import END, START, StateGraph

from .rag import Hit, KnowledgeBase


MIN_COVERAGE = 0.5


class Turn(TypedDict):
    role: Literal["user", "assistant"]
    content: str


class ChatState(TypedDict, total=False):
    question: str
    history: list[Turn]
    route: str
    standalone: str
    hits: list[Hit]
    answer: str
    sources: list[dict]
    steps: list[dict]
    model: str


SYSTEM = """당신은 1인 풀스택 프로젝트 「코디컴퍼챗(CodiComperChat)」의 포트폴리오 가이드입니다.
방문자(채용 담당자·개발자)가 이 프로젝트가 무엇이고, 어떻게 만들어졌고, 어디서 막혔고, 어떻게 풀었는지 이해하도록 돕습니다.

규칙
1. 아래 "자료"에 있는 사실만 말합니다. 자료에 없는 수치·이름·날짜는 지어내지 않고 "자료에서 찾지 못했다"고 말합니다.
2. 문장 끝에 근거 번호를 [1], [2]처럼 답니다. 여러 자료를 합쳤으면 번호를 함께 답니다.
3. 한국어로, 핵심부터 3~8문장 또는 짧은 목록으로 답합니다. 표가 필요하면 마크다운 표를 씁니다.
4. 더 볼 곳이 있으면 질문과 가장 관련 있는 포트폴리오 페이지 하나만 골라 마지막 줄에 안내합니다(/frontend, /console, /backend, /ai, /future, /data, /erd 중). 모든 페이지를 나열하지 않습니다.
5. 비밀값(키·토큰·비밀번호)이나 개인 정보는 자료에 있어도 말하지 않습니다."""

PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM + "\n\n자료\n{context}"),
        MessagesPlaceholder("history"),
        ("human", "{question}"),
    ]
)

CONDENSE = ChatPromptTemplate.from_messages(
    [
        ("system", "대화 기록을 참고해 마지막 질문을 앞말 없이도 이해되는 한 문장 질문으로 다시 쓰세요. 질문만 출력합니다."),
        MessagesPlaceholder("history"),
        ("human", "{question}"),
    ]
)

_GREETING = re.compile(r"^\s*(안녕|반가|하이|hello|hi\b|hey|처음|누구(세요|야|니)?\??$|너는 누구|뭘 할 수|무엇을 할 수|사용법|도움말)", re.I)
_DEPENDENT = re.compile(r"(그거|그것|그건|이거|이건|저거|거기|그럼|그러면|왜\??$|어떻게\??$|더\s|자세히|예를 들|그 부분|그때)")

GREETING_ANSWER = """안녕하세요! 저는 **코디컴퍼챗 포트폴리오 가이드**예요. 저장소 문서와 기획 스프레드시트를 근거로 이 프로젝트를 설명해 드립니다.

이런 걸 물어보세요.
- 코디컴퍼챗은 어떤 서비스이고, 보통의 캐릭터 채팅과 무엇이 다른가요?
- 비밀 퀘스트 판정에서 "잘못 통과 0건"은 어떻게 만들었나요?
- 웹 · Nest · FastAPI는 왜 이렇게 나눴나요?
- 무료 서버에 어떻게 배포했고, 어디서 막혔나요?
- 작은 모델의 나레이션 점수를 7/12에서 48/48로 올린 방법은?

답 끝의 [번호]를 누르면 근거 문서를 볼 수 있어요."""


def _history_messages(history: list[Turn]) -> list:
    msgs = []
    for t in history[-8:]:  # 최근 4번 주고받은 것만 (작은 모델의 문맥을 아낀다)
        msgs.append(HumanMessage(t["content"]) if t["role"] == "user" else AIMessage(t["content"]))
    return msgs


def _timed(name: str, fn: Callable[[ChatState], dict]) -> Callable[[ChatState], dict]:
    def run(state: ChatState) -> dict:
        t0 = time.perf_counter()
        out = fn(state)
        steps = list(state.get("steps", [])) + [{"node": name, "ms": round((time.perf_counter() - t0) * 1000)}]
        return {**out, "steps": steps}

    return run


def build_graph(kb: KnowledgeBase, llm_for: Callable[[str], BaseChatModel], chat_model: str, fallback_model: str, min_score: float):
    def route(state: ChatState) -> dict:
        q = state["question"].strip()
        return {"route": "greeting" if _GREETING.search(q) and len(q) < 40 else "project"}

    def greeting(state: ChatState) -> dict:
        return {"answer": GREETING_ANSWER, "sources": [], "model": "rule"}

    def condense(state: ChatState) -> dict:
        q, history = state["question"], state.get("history", [])
        if not history or not (_DEPENDENT.search(q) or len(q) < 12):
            return {"standalone": q}
        try:
            chain = CONDENSE | llm_for(chat_model) | StrOutputParser()
            rewritten = chain.invoke({"history": _history_messages(history), "question": q}).strip().splitlines()[0]
            return {"standalone": rewritten or q}
        except Exception:  # 재작성이 안 되면 원래 질문으로 검색한다
            return {"standalone": q}

    def retrieve(state: ChatState) -> dict:
        return {"hits": kb.search(state.get("standalone") or state["question"])}

    def grade(state: ChatState) -> dict:
        seen, kept = set(), []
        for h in state.get("hits", []):
            key = (h.doc.metadata["source"], h.doc.metadata.get("heading", ""))
            # 점수만 보면 흔한 낱말 하나("추천")로도 높게 나온다. 질문 핵심어의 절반 이상이 들어 있어야 근거로 본다
            if h.score < min_score or h.coverage < MIN_COVERAGE or key in seen:
                continue
            seen.add(key)
            kept.append(h)
        return {"hits": kept[:5]}

    def after_grade(state: ChatState) -> str:
        return "generate" if state.get("hits") else "no_context"

    def generate(state: ChatState) -> dict:
        hits = state["hits"]
        context = "\n\n".join(
            f"[{i}] ({h.doc.metadata['source']}{' · ' + h.doc.metadata['heading'] if h.doc.metadata.get('heading') else ''})\n{h.doc.page_content}"
            for i, h in enumerate(hits, 1)
        )
        payload = {"context": context, "history": _history_messages(state.get("history", [])), "question": state["question"]}
        last_error: Exception | None = None
        for model in dict.fromkeys([chat_model, fallback_model]):
            try:
                answer = (PROMPT | llm_for(model) | StrOutputParser()).invoke(payload).strip()
                if answer:
                    return {"answer": answer, "model": model, "sources": _sources(hits)}
                last_error = ValueError(f"{model}이(가) 빈 답을 냈다")
            except Exception as e:  # 연결 실패·모델 없음 → 예비 모델
                last_error = e
        raise RuntimeError(f"대화 모델을 부르지 못했다: {last_error}")

    def no_context(state: ChatState) -> dict:
        return {
            "answer": "저장소 문서와 기획 자료에서 그 질문의 근거를 찾지 못했어요. 지어내서 답하지 않을게요.\n\n"
            "프로젝트의 기능 · 구조 · 배포 · AI 평가 · 일정에 관해 물어봐 주시거나, 목차의 각 페이지(/frontend, /backend, /ai, /erd, /data)를 둘러봐 주세요.",
            "sources": [],
            "model": "rule",
        }

    g = StateGraph(ChatState)
    g.add_node("route", _timed("route", route))
    g.add_node("greeting", _timed("greeting", greeting))
    g.add_node("condense", _timed("condense", condense))
    g.add_node("retrieve", _timed("retrieve", retrieve))
    g.add_node("grade", _timed("grade", grade))
    g.add_node("generate", _timed("generate", generate))
    g.add_node("no_context", _timed("no_context", no_context))
    g.add_edge(START, "route")
    g.add_conditional_edges("route", lambda s: s["route"], {"greeting": "greeting", "project": "condense"})
    g.add_edge("condense", "retrieve")
    g.add_edge("retrieve", "grade")
    g.add_conditional_edges("grade", after_grade, {"generate": "generate", "no_context": "no_context"})
    for end in ["greeting", "generate", "no_context"]:
        g.add_edge(end, END)
    return g.compile()


def _sources(hits: list[Hit]) -> list[dict]:
    return [
        {
            "n": i,
            "source": h.doc.metadata["source"],
            "heading": h.doc.metadata.get("heading", ""),
            "score": round(h.score, 2),
            "snippet": re.sub(r"\s+", " ", h.doc.page_content)[:280],
        }
        for i, h in enumerate(hits, 1)
    ]


MERMAID = """flowchart LR
  S([질문]) --> R{route}
  R -- 인사 --> G[greeting]
  R -- 프로젝트 --> C[condense]
  C --> RT[retrieve<br/>BM25 2-gram]
  RT --> GR{grade}
  GR -- 근거 있음 --> GEN[generate<br/>gemma4:12b]
  GR -- 근거 없음 --> N[no_context]
  G --> E([답])
  GEN --> E
  N --> E"""
