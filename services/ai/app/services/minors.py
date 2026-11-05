"""미성년자를 가리키는 설정 찾기. 성인 그림(코디포토넷·웹툰)과 성인 대화가 같이 쓴다.

넓게 잡는다(과거 이야기 "고등학생 때"도 걸린다): 성인 콘텐츠에서는 지나치게 막는 쪽이 낫다.
"학생"·"대학생"만으로는 걸지 않는다.
"""

import re

MINOR_WORDS = re.compile(
    r"(초등학생|중학생|고등학생|초등학교|중학교|고등학교|초딩|중딩|고딩|미성년|어린이|아동|유아|아기(?!자기)|청소년|소년|소녀|"
    r"여고생|남고생|여중생|남중생|[초중고]\s?[1-6]학년|(?<![가-힣])[중고][1-3](?![0-9])|교복|"
    r"\bteen\w*|\bhigh\s?school\w*|\bmiddle\s?school\w*|\bschool\s?(girl|boy)\w*|\bloli\w*|\bshota\w*|\bchild\w*|\bkids?\b|\bunderage|\bminor\b)",
    re.I,
)
# "17살", "15세" (… 세기 제외), 영어 "17 years old"
MINOR_AGE = re.compile(r"(?<![0-9])([0-9]{1,2})\s*(살|세(?!기)|years?\s*old|yo\b)", re.I)


def minor_in(text: str | None) -> str | None:
    """미성년자를 가리키는 낱말이나 19세 미만 나이가 있으면 그 부분을 돌려준다(없으면 None)."""
    if not text:
        return None
    if m := MINOR_WORDS.search(text):
        return m.group(0).strip()
    for m in MINOR_AGE.finditer(text):
        if int(m.group(1)) < 19:
            return m.group(0).strip()
    return None
