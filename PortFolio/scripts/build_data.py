"""포트폴리오 데이터 만들기.

    python PortFolio/scripts/build_data.py

하는 일
1. PortFile/*.xlsx(기획 스프레드시트) → shared/data/sheets.json
2. ERD mermaid(docs/.assets/erd/*.mmd, 없으면 ERD 브랜치에서 git show) → shared/data/erd.json
3. 챗봇 RAG 자료: 저장소 문서 + 포트폴리오 콘텐츠 → server/ai_services/knowledge/*.md
4. 각 서비스가 따로 배포될 수 있게 JSON을 frontend/src/data, server/backend/data 로 복사

같은 입력이면 같은 결과가 나온다. 결과 파일은 커밋한다(배포 때 원본 저장소 전체가 없어도 돈다).
"""

from __future__ import annotations

import datetime as dt
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import openpyxl

PF = Path(__file__).resolve().parents[1]
ROOT = PF.parent
SHARED = PF / "shared"
DATA = SHARED / "data"
ERD_REF = "origin/claude/project-thread-gkkp1j"
ERD_GROUPS = [
    ("overview", "전체 관계도"),
    ("account", "계정 · 결제 · 코레딧"),
    ("chat", "캐릭터 · 대화"),
    ("ops", "오퍼레이션"),
    ("world", "월드코퍼챗"),
    ("standalone", "독립 테이블"),
]


def cell(v):
    if v is None:
        return ""
    if isinstance(v, (dt.datetime, dt.date)):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()


def build_sheets() -> list[dict]:
    xlsx = next((PF / "PortFile").glob("*.xlsx"))
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    sheets = []
    for i, ws in enumerate(wb.worksheets):
        rows = [[cell(c) for c in r] for r in ws.iter_rows(values_only=True)]
        rows = [r for r in rows if any(r)]
        # 머리말 줄: 위쪽 8줄 중 처음으로 칸이 3개 이상 찬 줄 (기획서처럼 표가 아닌 시트는 없다)
        def is_header(r):
            filled = [c for c in r if c]
            return len(filled) >= 4 and max(len(c) for c in filled) <= 40
        header_at = next((k for k, r in enumerate(rows[:8]) if is_header(r)), None)
        meta = [r[0] for r in rows[: header_at if header_at is not None else 3] if r and r[0] and sum(1 for c in r if c) <= 2]
        if header_at is None:
            # 머리글 없는 '구분 · 항목 · 내용' 표 (예: 프로젝트 총기획)
            body = [r[:3] for r in rows if sum(1 for c in r[:3] if c) >= 2]
            if len(body) >= 5:
                sheets.append({"id": f"s{i + 1}", "name": ws.title, "title": meta[0] if meta else ws.title, "meta": meta[1:], "kind": "table", "header": ["구분", "항목", "내용"], "rows": body})
                continue
            body = [" ".join(c for c in r if c) for r in rows[1:]]
            sheets.append({"id": f"s{i + 1}", "name": ws.title, "title": meta[0] if meta else ws.title, "meta": meta[1:], "kind": "text", "lines": body})
            continue
        header = rows[header_at]
        width = max(k for k, h in enumerate(header) if h) + 1
        data = [r[:width] for r in rows[header_at + 1 :]]
        # 간트처럼 날짜 칸이 많은 시트는 앞쪽 설명 칸만 표로 보이고, 날짜 칸은 막대 자료로 따로 둔다
        date_cols = [k for k, h in enumerate(header[:width]) if re.fullmatch(r"\d{4}-\d{2}-\d{2}", h or "")]
        if len(date_cols) > 10:
            first = date_cols[0]
            table_header = header[:first]
            # 날짜 칸은 값이 아니라 칠한 색이라, '시작'·'종료' 열로 막대를 만든다
            si = table_header.index("시작") if "시작" in table_header else None
            ei = table_header.index("종료") if "종료" in table_header else None
            bars = []
            for r in data:
                start = r[si] if si is not None and si < len(r) else ""
                end = r[ei] if ei is not None and ei < len(r) else start
                bars.append({"start": start, "end": end or start})
            sheets.append({"id": f"s{i + 1}", "name": ws.title, "title": meta[0] if meta else ws.title, "meta": meta[1:], "kind": "gantt", "header": table_header, "rows": [r[:first] for r in data], "bars": bars})
        else:
            sheets.append({"id": f"s{i + 1}", "name": ws.title, "title": meta[0] if meta else ws.title, "meta": meta[1:], "kind": "table", "header": header[:width], "rows": data})
    return sheets


def read_erd(name: str) -> str:
    local = ROOT / "docs" / ".assets" / "erd" / f"{name}.mmd"
    if local.exists():
        return local.read_text(encoding="utf-8")
    out = subprocess.run(["git", "show", f"{ERD_REF}:docs/.assets/erd/{name}.mmd"], cwd=ROOT, capture_output=True)
    if out.returncode != 0:
        sys.exit(f"ERD {name}.mmd 를 찾지 못했다 (로컬에도 {ERD_REF}에도 없음)")
    return out.stdout.decode("utf-8")


REL = re.compile(r"^\s*(\w+)\s+([|}o{]{2}--[|}o{]{2})\s+(\w+)\s*:\s*\"([^\"]*)\"")
ENT = re.compile(r"^\s*(\w+)\s*\{\s*$")
COL = re.compile(r'^\s*(\S+)\s+(\w+)(?:\s+([A-Z,]+))?(?:\s+"([^"]*)")?\s*$')


def build_erd() -> dict:
    groups, tables, relations = [], {}, {}
    for key, title in ERD_GROUPS:
        text = read_erd(key)
        groups.append({"key": key, "title": title, "mermaid": text.strip()})
        current = None
        for line in text.splitlines():
            m = REL.match(line)
            if m:
                a, card, b, label = m.groups()
                fk, _, action = label.partition(" · ")
                relations[(a, b, fk)] = {"parent": a, "child": b, "card": card, "fk": fk.strip(), "onDelete": action.strip()}
                continue
            m = ENT.match(line)
            if m:
                current = m.group(1)
                continue
            if current and line.strip() == "}":
                current = None
                continue
            if current:
                m = COL.match(line)
                if not m:
                    continue
                typ, name, keys, note = m.groups()
                if note and "그림에 전체" in note:
                    continue  # 다른 영역 그림에 전체가 있다는 자리표시
                cols = tables.setdefault(current, {"name": current, "group": key, "columns": []})["columns"]
                if not any(c["name"] == name for c in cols):
                    cols.append({"name": name, "type": typ, "keys": (keys or "").split(",") if keys else [], "note": note or ""})
    for t in tables.values():
        if t["group"] == "overview":
            t["group"] = "standalone"
    rels = sorted(relations.values(), key=lambda r: (r["parent"], r["child"]))
    return {
        "counts": {"tables": len(tables), "relations": len(rels)},
        "groups": groups,
        "tables": sorted(tables.values(), key=lambda t: t["name"]),
        "relations": rels,
    }


KNOWLEDGE_DOCS = [
    "README.md",
    "docs/FEATURES.md",
    "docs/AGENT_HANDOVER.md",
    "docs/DEPLOYMENT.md",
    "docs/WORKFLOW.md",
    "docs/plan/CURRENT_STACK.md",
    "docs/plan/AI_MODEL_STRATEGY.md",
    "docs/plan/TESTING.md",
    "docs/plan/WORLD_COPPERCHAT.md",
    "docs/Architecture/overview.md",
    "docs/web_management/oracle-backend.md",
    "docs/web_management/deploy-log-2026-11-07.md",
    "docs/trainings/README.md",
    "docs/trainings/narration-and-reward.md",
    "docs/trainings/quest-judging.md",
    "docs/trainings/memory-and-grounding.md",
    "docs/trainings/oracle-deploy-latency.md",
    "apps/web/README.md",
    "console/README.md",
    "apps/api/README.md",
    "services/ai/README.md",
    "SECURITY.md",
]


def strip_noise(md: str) -> str:
    md = re.sub(r"<!--.*?-->", "", md, flags=re.S)
    md = re.sub(r"<(table|tr|td|img|a|br|sub|p)[^>]*>|</(table|tr|td|a|sub|p)>", " ", md)
    md = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", md)
    return re.sub(r"\n{3,}", "\n\n", md).strip()


def content_to_markdown(content: dict) -> str:
    s, p = content["site"], content["project"]
    out = [f"# {s['brand']} 포트폴리오", s["intro"], f"기간: {s['period']} · {s['author']}", "", "## 프로젝트 한 줄", p["oneLine"], "", "## 해결한 문제"]
    out += [f"- {a} → {b}" for a, b in p["compare"]]
    out += ["", "## 기술 스택"] + [f"- {a}: {b}" for a, b in p["stack"]]
    for page in content["pages"].values():
        out += ["", f"## {page['title']}", page["summary"]]
        for sec in page["sections"]:
            out += ["", f"### {page['title']} — {sec['title']}"]
            if sec.get("body"):
                out.append(sec["body"])
            out += [f"- {b}" for b in sec.get("bullets", [])]
            out += [f"- {a}: {b}" for a, b in sec.get("table", [])]
    return "\n".join(out)


def build_knowledge(content: dict, sheets: list[dict]) -> int:
    dest = PF / "server" / "ai_services" / "knowledge"
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)
    n = 0
    for rel in KNOWLEDGE_DOCS:
        src = ROOT / rel
        if not src.exists():
            continue
        name = rel.replace("/", "__")
        (dest / name).write_text(f"<!-- source: {rel} -->\n" + strip_noise(src.read_text(encoding="utf-8")), encoding="utf-8")
        n += 1
    (dest / "portfolio.md").write_text("<!-- source: PortFolio/shared/content/portfolio.json -->\n" + content_to_markdown(content), encoding="utf-8")
    lines = []
    for sh in sheets:
        lines.append(f"## 스프레드시트 시트: {sh['name']}")
        if sh["kind"] == "text":
            lines += sh["lines"]
        else:
            for r in sh["rows"]:
                pairs = [f"{h}: {v}" for h, v in zip(sh["header"], r) if h and v]
                if pairs:
                    lines.append("- " + " · ".join(pairs))
        lines.append("")
    (dest / "spreadsheet.md").write_text("<!-- source: PortFile 스프레드시트 -->\n" + "\n".join(lines), encoding="utf-8")
    return n + 2


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def main() -> None:
    content = json.loads((SHARED / "content" / "portfolio.json").read_text(encoding="utf-8"))
    sheets = build_sheets()
    erd = build_erd()
    write_json(DATA / "sheets.json", sheets)
    write_json(DATA / "erd.json", erd)
    docs = build_knowledge(content, sheets)
    for target in [PF / "frontend" / "src" / "data", PF / "server" / "backend" / "data"]:
        target.mkdir(parents=True, exist_ok=True)
        for f in ["sheets.json", "erd.json"]:
            shutil.copyfile(DATA / f, target / f)
        shutil.copyfile(SHARED / "content" / "portfolio.json", target / "portfolio.json")
    print(f"시트 {len(sheets)}개 · ERD 테이블 {erd['counts']['tables']}개 관계 {erd['counts']['relations']}개 · 지식 문서 {docs}개")


if __name__ == "__main__":
    main()
