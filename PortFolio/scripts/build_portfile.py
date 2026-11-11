"""포트폴리오 문서 만들기: Word · PDF · PowerPoint.

    PortFolio/scripts/.venv/Scripts/python.exe PortFolio/scripts/build_portfile.py

콘텐츠 정본(shared/content/portfolio.json)과 사이트의 스크린샷(frontend/public/shots)을 쓴다.
결과: PortFile/CodiComperChat_Portfolio.{docx,pdf,pptx} → frontend/public/files 로도 복사(엑셀은 영문 이름으로).
글꼴: 한글은 맑은 고딕(Windows). 다른 OS면 FONT_PATH 환경변수로 TTF를 준다.
"""

from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Image, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)

PF = Path(__file__).resolve().parents[1]
OUT = PF / "PortFile"
SHOTS = PF / "frontend" / "public" / "shots"
PUBLIC_FILES = PF / "frontend" / "public" / "files"
C = json.loads((PF / "shared" / "content" / "portfolio.json").read_text(encoding="utf-8"))
SITE, PROJ, PAGES, TOC = C["site"], C["project"], C["pages"], C["toc"]
ORDER = ["frontend", "console", "backend", "ai", "updates", "frameworks", "future"]

INK = (0x0F, 0x1B, 0x2D)
COPPER = (0xB8, 0x64, 0x2A)
MUTED = (0x5B, 0x66, 0x78)
PAPER = (0xF7, 0xF4, 0xEE)
SOFT = (0xF6, 0xE6, 0xD6)
KFONT = "맑은 고딕"
FONT_PATH = os.environ.get("FONT_PATH", r"C:\Windows\Fonts\malgun.ttf")
FONT_BOLD = os.environ.get("FONT_BOLD_PATH", r"C:\Windows\Fonts\malgunbd.ttf")


def shot(src: str) -> Path | None:
    p = SHOTS / Path(src).name
    return p if p.exists() else None


def plain(t: str) -> str:
    return t.replace("`", "")


# ───────────────────────────── Word ─────────────────────────────
def build_docx(path: Path) -> None:
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    for side in ("left_margin", "right_margin"):
        setattr(sec, side, Cm(2.2))
    sec.top_margin, sec.bottom_margin = Cm(2), Cm(2)

    def set_font(style, size=None, bold=None, color=None):
        style.font.name = KFONT
        style.element.rPr.rFonts.set(qn("w:eastAsia"), KFONT)
        if size:
            style.font.size = Pt(size)
        if bold is not None:
            style.font.bold = bold
        if color:
            style.font.color.rgb = RGBColor(*color)

    set_font(doc.styles["Normal"], 10.5)
    doc.styles["Normal"].paragraph_format.line_spacing = 1.25
    doc.styles["Normal"].paragraph_format.space_after = Pt(6)
    for name, size in (("Title", 30), ("Heading 1", 18), ("Heading 2", 13.5), ("Heading 3", 11.5)):
        set_font(doc.styles[name], size, True, (0, 0, 0))

    # 머리말·꼬리말
    hp = sec.header.paragraphs[0]
    hp.text = f"{SITE['brand']} 포트폴리오"
    hp.runs[0].font.size, hp.runs[0].font.color.rgb = Pt(8), RGBColor(*MUTED)
    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fp.text = f"{SITE['repo']}"
    fp.runs[0].font.size, fp.runs[0].font.color.rgb = Pt(8), RGBColor(*MUTED)

    def table(rows, header=None, widths=(5, 11)):
        t = doc.add_table(rows=0, cols=len(rows[0]) if rows else 2)
        t.style = "Table Grid"
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        if header:
            cells = t.add_row().cells
            for c, h in zip(cells, header):
                c.text = h
                c.paragraphs[0].runs[0].font.bold = True
        for r in rows:
            cells = t.add_row().cells
            for c, v in zip(cells, r):
                c.text = plain(v)
        for row in t.rows:
            for c, w in zip(row.cells, widths):
                c.width = Cm(w)
                from docx.oxml import OxmlElement
                props = c._tc.get_or_add_tcPr()
                borders = OxmlElement('w:tcBorders')
                for edge in ('top','left','bottom','right'):
                    el = OxmlElement('w:' + edge)
                    for key,val in [('val','single'),('sz','4'),('color','D9D9D9')]:
                        el.set(qn('w:' + key),val)
                    borders.append(el)
                props.append(borders)
                for p in c.paragraphs:
                    p.paragraph_format.space_after = Pt(4)
                    p.paragraph_format.line_spacing = 1.15
                    for run in p.runs:
                        run.font.size = Pt(9.5)
        doc.add_paragraph()

    # 표지
    doc.add_paragraph('코디컴퍼챗 개발 포트폴리오', style="Title")
    p = doc.add_paragraph(SITE["tagline"])
    p.runs[0].font.size, p.runs[0].font.color.rgb = Pt(14), RGBColor(*COPPER)
    doc.add_paragraph(SITE["intro"])
    doc.add_paragraph(SITE['evidenceNote'])
    table([["기간", SITE["period"]], ["역할", SITE["author"]], ["서비스", SITE["service"]], ["저장소", SITE["repo"]], ["포트폴리오 사이트", "PortFolio/frontend (Astro)"]])
    table([[s["label"], s["value"]] for s in SITE["stats"]], header=["규모", "값"])
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # 목차
    doc.add_heading("목차", 1)
    for t in TOC:
        doc.add_paragraph(f"{t['no']}  {t['title']} — {t['sub']}")
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # 프로젝트
    doc.add_heading("프로젝트 소개", 1)
    doc.add_paragraph(PROJ["oneLine"])
    doc.add_heading("반복되던 문제", 2)
    for x in PROJ["problem"]:
        doc.add_paragraph(x, style="List Bullet")
    doc.add_paragraph(PROJ["answer"]).runs[0].font.bold = True
    table(PROJ["compare"], header=["보통의 캐릭터 채팅", "코디컴퍼챗"], widths=(7, 9))
    doc.add_heading("간단한 기능 소개", 2)
    for f in PROJ["features"]:
        para = doc.add_paragraph(style="List Bullet")
        para.add_run(f["title"] + " — ").bold = True
        para.add_run(f["text"])
    doc.add_heading("기술 스택", 2)
    table(PROJ["stack"])
    if (a := shot("/shots/framework-product.png")):
        doc.add_picture(str(a), width=Cm(16.6))
        doc.add_paragraph("시스템 구조: 웹은 Nest만 알고, Nest만 DB와 AI를 알고, AI는 DB를 모른다.").runs[0].font.color.rgb = RGBColor(*MUTED)

    # 층별
    for slug in ORDER:
        page = PAGES[slug]
        doc.add_paragraph()
        k = doc.add_paragraph(page["kicker"])
        k.paragraph_format.keep_with_next = True
        k.runs[0].font.color.rgb, k.runs[0].font.size, k.runs[0].font.bold = RGBColor(*COPPER), Pt(9), True
        doc.add_heading(page["title"], 1)
        doc.add_paragraph(page["summary"])
        for i, s in enumerate(page["sections"], 1):
            doc.add_heading(f"{i:02d}. {s['title']}", 2)
            if s.get("body"):
                doc.add_paragraph(plain(s["body"]))
            for b in s.get("bullets", []):
                doc.add_paragraph(plain(b), style="List Bullet")
            if s.get("table"):
                table(s["table"])
            imgs = [x for x in s.get("images", []) if shot(x["src"])][:4]
            if imgs:
                t = doc.add_table(rows=0, cols=2)
                for j in range(0, len(imgs), 2):
                    cells = t.add_row().cells
                    for c, img in zip(cells, imgs[j : j + 2]):
                        r = c.paragraphs[0].add_run()
                        r.add_picture(str(shot(img["src"])), width=Cm(7.8))
                        cap = c.add_paragraph(img["caption"])
                        cap.runs[0].font.size, cap.runs[0].font.color.rgb = Pt(8.5), RGBColor(*MUTED)
                doc.add_paragraph()
    # Word 기본 Title 스타일의 밑줄 잔여와 그림·설명 분리를 막는다.
    for element in doc.element.xpath('.//w:pBdr'):
        element.getparent().remove(element)
    for style in doc.styles:
        for element in style.element.xpath('.//w:pBdr'):
            element.getparent().remove(element)
    paragraphs = doc.paragraphs
    for i, para in enumerate(paragraphs[:-1]):
        if para._p.xpath('.//w:drawing'):
            para.paragraph_format.keep_with_next = True
    from docx.oxml import OxmlElement
    for t in doc.tables:
        for row in t.rows:
            row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
            for cell in row.cells:
                for para in cell.paragraphs:
                    if para._p.xpath('.//w:drawing'):
                        para.paragraph_format.keep_with_next = True
    doc.save(path)


# ───────────────────────────── PDF ─────────────────────────────
def build_pdf(path: Path) -> None:
    pdfmetrics.registerFont(TTFont("K", FONT_PATH))
    pdfmetrics.registerFont(TTFont("KB", FONT_BOLD))
    ink, copper, muted, soft = (colors.Color(*(v / 255 for v in c)) for c in (INK, COPPER, MUTED, SOFT))
    st = {
        "title": ParagraphStyle("t", fontName="KB", fontSize=28, leading=36, textColor=ink, spaceAfter=10),
        "tag": ParagraphStyle("g", fontName="KB", fontSize=14, leading=20, textColor=copper, spaceAfter=14),
        "kick": ParagraphStyle("k", fontName="KB", fontSize=8.5, leading=12, textColor=copper, spaceAfter=4),
        "h1": ParagraphStyle("h1", fontName="KB", fontSize=19, leading=26, textColor=ink, spaceBefore=4, spaceAfter=10),
        "h2": ParagraphStyle("h2", fontName="KB", fontSize=12.5, leading=18, textColor=copper, spaceBefore=12, spaceAfter=6),
        "p": ParagraphStyle("p", fontName="K", fontSize=9.8, leading=16, textColor=ink, spaceAfter=6, wordWrap="CJK"),
        "b": ParagraphStyle("b", fontName="K", fontSize=9.6, leading=15, textColor=ink, leftIndent=12, bulletIndent=2, spaceAfter=3, wordWrap="CJK"),
        "cell": ParagraphStyle("c", fontName="K", fontSize=8.8, leading=13, textColor=ink, wordWrap="CJK"),
        "cellb": ParagraphStyle("cb", fontName="KB", fontSize=8.8, leading=13, textColor=ink, wordWrap="CJK"),
        "cap": ParagraphStyle("cap", fontName="K", fontSize=8, leading=11, textColor=muted, alignment=TA_CENTER, spaceAfter=8),
    }
    esc = lambda t: plain(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")  # noqa: E731

    def tbl(rows, header=None, widths=(50, 120)):
        data = ([[Paragraph(esc(h), st["cellb"]) for h in header]] if header else []) + [
            [Paragraph(esc(c), st["cellb"] if k == 0 and not header else st["cell"]) for k, c in enumerate(r)] for r in rows
        ]
        t = Table(data, colWidths=[w * mm for w in widths], hAlign="LEFT")
        style = [("GRID", (0, 0), (-1, -1), 0.4, colors.Color(0.89, 0.85, 0.79)), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]
        style.append(("BACKGROUND", (0, 0), (-1 if header else 0, 0 if header else -1), soft))
        t.setStyle(TableStyle(style))
        return t

    def img(src, width=170):
        p = shot(src)
        if not p:
            return None
        im = Image(str(p))
        ratio = im.imageHeight / im.imageWidth
        im.drawWidth, im.drawHeight = width * mm, width * mm * ratio
        if im.drawHeight > 105 * mm:
            im.drawHeight, im.drawWidth = 105 * mm, 105 * mm / ratio
        return im

    story = []
    story += [Paragraph(SITE["title"], st["title"]), Paragraph(SITE["tagline"], st["tag"]), Paragraph(esc(SITE["intro"]), st["p"]), Spacer(1, 8)]
    story += [Paragraph(esc(SITE['evidenceNote']), st['p'])]
    story.append(tbl([["기간", SITE["period"]], ["역할", SITE["author"]], ["서비스", SITE["service"]], ["저장소", SITE["repo"]]]))
    story += [Spacer(1, 10), tbl([[s["label"], s["value"]] for s in SITE["stats"]], header=["규모", "값"]), PageBreak()]
    story += [Paragraph("목차", st["h1"])] + [Paragraph(f"<b>{t['no']}</b>  {t['title']} — {t['sub']}", st["p"]) for t in TOC] + [PageBreak()]
    story += [Paragraph("프로젝트 소개", st["h1"]), Paragraph(esc(PROJ["oneLine"]), st["p"]), Paragraph("반복되던 문제", st["h2"])]
    story += [Paragraph(esc(x), st["b"], bulletText="•") for x in PROJ["problem"]]
    story += [Paragraph(f"<b>{esc(PROJ['answer'])}</b>", st["p"]), tbl(PROJ["compare"], header=["보통의 캐릭터 채팅", "코디컴퍼챗"], widths=(70, 100))]
    story += [Paragraph("간단한 기능 소개", st["h2"])] + [Paragraph(f"<b>{esc(f['title'])}</b> — {esc(f['text'])}", st["b"], bulletText="•") for f in PROJ["features"]]
    story += [Paragraph("기술 스택", st["h2"]), tbl(PROJ["stack"])]
    if (a := img("/shots/framework-product.png")):
        story += [Spacer(1, 8), a, Paragraph("시스템 구조", st["cap"])]
    for slug in ORDER:
        page = PAGES[slug]
        story += [PageBreak(), Paragraph(page["kicker"], st["kick"]), Paragraph(esc(page["title"]), st["h1"]), Paragraph(esc(page["summary"]), st["p"])]
        for i, s in enumerate(page["sections"], 1):
            block = [Paragraph(f"{i:02d}. {esc(s['title'])}", st["h2"])]
            if s.get("body"):
                block.append(Paragraph(esc(s["body"]), st["p"]))
            block += [Paragraph(esc(b), st["b"], bulletText="•") for b in s.get("bullets", [])]
            if s.get("table"):
                block.append(tbl(s["table"]))
            story.append(KeepTogether(block[:3]))
            story += block[3:]
            imgs = [x for x in s.get("images", []) if shot(x["src"])][:2]
            for x in imgs:
                story += [Spacer(1, 6), img(x["src"], 150), Paragraph(esc(x["caption"]), st["cap"])]

    def deco(canvas, d):
        canvas.saveState()
        canvas.setFillColor(copper)
        canvas.rect(0, A4[1] - 6, A4[0], 6, fill=1, stroke=0)
        canvas.setFont("K", 7.5)
        canvas.setFillColor(muted)
        canvas.drawString(18 * mm, 10 * mm, f"{SITE['brand']} 포트폴리오 · {SITE['period']}")
        canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, str(d.page))
        canvas.restoreState()

    SimpleDocTemplate(str(path), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm, bottomMargin=18 * mm,
                      title=SITE["title"], author="CodiComperChat").build(story, onFirstPage=deco, onLaterPages=deco)


# ───────────────────────────── PowerPoint ─────────────────────────────
def main() -> None:
    OUT.mkdir(exist_ok=True)
    PUBLIC_FILES.mkdir(parents=True, exist_ok=True)
    outs = [OUT / "CodiComperChat_Portfolio.docx", OUT / "CodiComperChat_Portfolio.pdf", OUT / "CodiComperChat_Portfolio.pptx"]
    build_docx(outs[0])
    build_pdf(outs[1])
    import subprocess
    subprocess.run([os.environ.get('ARTIFACT_NODE', 'node'), str(PF / 'scripts' / 'build_presentation.mjs')], check=True)
    xlsx = next(OUT.glob("*스프레드*.xlsx"), None) or next(OUT.glob("*.xlsx"))
    for f in outs:
        shutil.copyfile(f, PUBLIC_FILES / f.name)
    shutil.copyfile(xlsx, PUBLIC_FILES / "CodiComperChat_planning.xlsx")
    for f in outs:
        print(f"{f.name}  {f.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
