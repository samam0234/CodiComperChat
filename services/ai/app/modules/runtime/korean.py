"""받침에 따라 갈리는 한국어 조사와, 답에 반복되는 맞춤법 오류.

가중치를 다시 가르치지 않는다. 배운 오류는 글이 나가기 직전에 항상 같은 문장으로 고친다.
"""

from __future__ import annotations

import json
import re
import unicodedata
from functools import cache
from pathlib import Path

HANGUL_BASE = 0xAC00
HANGUL_LAST = 0xD7A3

Pair = str


def _last_hangul(word: str) -> str | None:
    for ch in reversed(word):
        code = ord(ch)
        if HANGUL_BASE <= code <= HANGUL_LAST:
            return ch
    return None


def has_batchim(word: str) -> bool:
    ch = _last_hangul(word)
    if ch is None:
        return False
    return (ord(ch) - HANGUL_BASE) % 28 != 0


def _rieul(word: str) -> bool:
    ch = _last_hangul(word)
    if ch is None:
        return False
    return (ord(ch) - HANGUL_BASE) % 28 == 8


def particle(word: str, pair: Pair) -> str:
    batchim = has_batchim(word)
    if pair == "이/가":
        return "이" if batchim else "가"
    if pair == "은/는":
        return "은" if batchim else "는"
    if pair == "을/를":
        return "을" if batchim else "를"
    if pair == "과/와":
        return "과" if batchim else "와"
    if pair == "으로/로":
        return "으로" if batchim and not _rieul(word) else "로"
    if pair == "이라고/라고":
        return "이라고" if batchim else "라고"
    raise ValueError(pair)


def josa(word: str, pair: Pair) -> str:
    return f"{word}{particle(word, pair)}"


_MARK = {
    "이(가)": "이/가",
    "가(이)": "이/가",
    "(이)가": "이/가",
    "은(는)": "은/는",
    "는(은)": "은/는",
    "(은)는": "은/는",
    "을(를)": "을/를",
    "를(을)": "을/를",
    "(을)를": "을/를",
    "와(과)": "과/와",
    "과(와)": "과/와",
    "(와)과": "과/와",
    "(이)라고": "이라고/라고",
    "(으)로": "으로/로",
}

_PAREN = re.compile(
    r"([0-9A-Za-z가-힣][0-9A-Za-z가-힣 _'’-]{0,40}?)"
    r"(이\(가\)|가\(이\)|\(이\)가|은\(는\)|는\(은\)|\(은\)는|을\(를\)|를\(을\)|\(을\)를|와\(과\)|과\(와\)|\(와\)과|\(이\)라고|\(으\)로)"
)


def fix_parenthetical_josa(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        name, mark = match.group(1), match.group(2)
        pair = _MARK.get(mark)
        if pair is None:
            return match.group(0)
        trimmed = name.rstrip()
        return josa(trimmed, pair) + name[len(trimmed) :]

    return _PAREN.sub(repl, text)


_PAIRS_PATH = Path(__file__).resolve().parents[2] / "data" / "grammar_pairs.json"
_DOUBLE_JOSA = (
    (re.compile(r"([가-힣])(?:을\s?를|를\s?을|을을|를를)"), "을/를"),
    (re.compile(r"([가-힣])(?:은\s?는|는\s?은|은은|는는)"), "은/는"),
    (re.compile(r"([가-힣])(?:으로\s?로|로로)"), "으로/로"),
)
# ㄹ 받침 뒤의 '수 있/없'만 띄운다. '변수있어'처럼 받침이 다르면 그대로 둔다.
_SU = re.compile(r"([가-힣])수(있|없)")
_PUNCT = re.compile(r"([.?!])(?=[가-힣])")
_SPACE_BEFORE_PUNCT = re.compile(r"[ \t]+([,.?!])")
_MULTI_SPACE = re.compile(r"[ \t]{2,}")
_YOYO = re.compile(r"요요(?=$|[\s.?!])")
_AN_DWAE = re.compile(r"(?<![가-힣])안돼")


@cache
def _learned_pairs() -> tuple[tuple[str, str], ...]:
    rows = json.loads(_PAIRS_PATH.read_text(encoding="utf-8"))
    pairs = []
    for row in rows:
        wrong, right = row["wrong"], row["right"]
        if wrong and wrong != right:
            pairs.append((wrong, right))
    pairs.sort(key=lambda item: len(item[0]), reverse=True)
    return tuple(pairs)


def _copula(text: str) -> str:
    """이에요/예요는 앞 글자 받침으로만 고친다. '해요'처럼 이미 맞는 어미는 건드리지 않는다."""

    def to_ieyo(match: re.Match[str]) -> str:
        prev = match.group(1)
        return prev + ("이에요" if has_batchim(prev) else "예요")

    text = re.sub(r"([가-힣])예요", to_ieyo, text)

    def to_yeyo(match: re.Match[str]) -> str:
        prev = match.group(1)
        return prev + ("예요" if not has_batchim(prev) else "이에요")

    return re.sub(r"([가-힣])이에요", to_yeyo, text)


def _su_spacing(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        stem = match.group(1)
        if not _rieul(stem):
            return match.group(0)
        return f"{stem} 수 {match.group(2)}"

    return _SU.sub(repl, text)


def _one_particle(text: str) -> str:
    def repl(pair: str):
        def inner(match: re.Match[str]) -> str:
            return josa(match.group(1), pair)

        return inner

    for pattern, pair in _DOUBLE_JOSA:
        text = pattern.sub(repl(pair), text)
    return text


def polish(text: str) -> str:
    """배운 맞춤법과 조사를 고친다. 이미 맞는 문장은 바꾸지 않는다."""
    if not text:
        return text
    cleaned = unicodedata.normalize("NFC", text)
    for wrong, right in _learned_pairs():
        cleaned = cleaned.replace(wrong, right)
    cleaned = _AN_DWAE.sub("안 돼", cleaned)
    cleaned = _copula(cleaned)
    cleaned = _su_spacing(cleaned)
    cleaned = _one_particle(cleaned)
    cleaned = _YOYO.sub("요", cleaned)
    cleaned = _SPACE_BEFORE_PUNCT.sub(r"\1", cleaned)
    cleaned = _PUNCT.sub(r"\1 ", cleaned)
    cleaned = _MULTI_SPACE.sub(" ", cleaned)
    return fix_parenthetical_josa(cleaned)
