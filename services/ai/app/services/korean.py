"""받침에 따라 갈리는 한국어 조사. '이(가)'처럼 두 조사를 괄호로 남겨 두지 않는다."""

from __future__ import annotations

import re

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
