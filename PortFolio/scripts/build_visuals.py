"""프레임워크 설명용 도식. 실제 화면 캡처와 구분해 PNG·SVG를 함께 만든다."""
from pathlib import Path
from html import escape
from PIL import Image, ImageDraw, ImageFont

PF = Path(__file__).resolve().parents[1]
OUT = PF / 'frontend/public/shots'
FONT = Path('C:/Windows/Fonts/malgun.ttf')
BOLD = Path('C:/Windows/Fonts/malgunbd.ttf')
BG, INK, COPPER, MUTED = '#101c2b', '#f5f1e9', '#e8a06c', '#b8c5d5'

def make(name, title, subtitle, rows, footer):
    im = Image.new('RGB',(1600,1000),BG)
    d = ImageDraw.Draw(im)
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" role="img" aria-labelledby="title desc"><title id="title">{escape(title)}</title><desc id="desc">{escape(subtitle)}</desc><rect width="1600" height="1000" fill="{BG}"/>']
    def text(x,y,t,size=25,color=INK,bold=False):
        d.text((x,y),t,font=ImageFont.truetype(str(BOLD if bold else FONT),size),fill=color)
        svg.append(f'<text x="{x}" y="{y+size}" font-family="Malgun Gothic, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}">{escape(t)}</text>')
    def rect(x,y,ww,hh):
        d.rounded_rectangle((x,y,x+ww,y+hh),radius=16,fill='#1b2b3f',outline='#3c5068',width=2)
        svg.append(f'<rect x="{x}" y="{y}" width="{ww}" height="{hh}" rx="16" fill="#1b2b3f" stroke="#3c5068" stroke-width="2"/>')
    text(72,52,'CODICOMPERCHAT / ENGINEERING NOTES',21,COPPER,True)
    text(72,107,title,51,INK,True)
    text(72,190,subtitle,26,MUTED)
    for i,(label,heading,body,code) in enumerate(rows):
        y = 285+i*139
        text(72,y+23,label,23,COPPER,True)
        rect(270,y,1258,119)
        text(300,y+18,heading,30,INK,True)
        text(300,y+66,body,24,MUTED)
        text(1150,y+24,code,20,COPPER)
    text(72,903,footer,22,MUTED)
    text(72,950,'설명용 구조도 · 저장소 기준 2026-11-11',18,MUTED)
    svg.append('</svg>')
    OUT.mkdir(parents=True,exist_ok=True)
    im.save(OUT/f'{name}.png',optimize=True)
    (OUT/f'{name}.svg').write_text('\n'.join(svg),encoding='utf-8')

def main():
    make('framework-product','제품 프레임워크와 신뢰 경계','이용자 화면과 운영 화면은 Nest를 거쳐 상태와 AI를 사용합니다.',[
      ('01  화면','Next.js / React','이용자 웹과 운영 콘솔 · 인증 쿠키 · 서버 액션','apps/web · console'),
      ('02  정책','Nest.js / TypeScript','인증 · 권한 · 코레딧 · 맥락 조립 · AI 요청 대기열','apps/api'),
      ('03  저장','Prisma / PostgreSQL','캠페인 · 기억 · 관계 · 장부 · 38개 테이블','apps/api/prisma'),
      ('04  추론','FastAPI / Python','연기 · 판정 · 요약 · 그림 · 내부 토큰으로 접근','services/ai')
    ],'호출: Next.js → Nest.js → PostgreSQL / FastAPI → Ollama · 호스팅 API · diffusers')
    make('framework-portfolio','포트폴리오 프레임워크와 콘텐츠 흐름','정적 자료는 바로 읽고, 프로젝트 질문은 근거 문서를 찾아 답합니다.',[
      ('01  읽기','Astro','정적 페이지 · ERD 탐색 · 스프레드시트 · 문서 다운로드','frontend'),
      ('02  중계','Ruby on Rails','콘텐츠·검색 API · 요청 검사 · Flask 챗봇 중계','server/backend'),
      ('03  근거','Flask / LangChain / LangGraph','분류 → BM25 검색 → 근거 선별 → 출처를 붙여 답변','server/ai_services'),
      ('04  정본','portfolio.json / 문서 생성기','사이트 · API · RAG 자료 · Word · PDF · PowerPoint','shared/content')
    ],'운영 기록: Astro는 Vercel, Rails·Flask는 Oracle. Ollama는 제품과 공유합니다.')
    make('portfolio-cover','CodiComperChat Portfolio','기억과 관계가 쌓이는 캐릭터 캠페인 · 1인 개발 프로젝트',[
      ('제품','이야기를 이어 가는 상태','장기 기억 · 마지막 대사 편집 · 세계관 · 비밀 퀘스트','PRODUCT'),
      ('설계','네 앱의 역할과 경계','Next.js · Nest.js · FastAPI · PostgreSQL','ARCHITECTURE'),
      ('검증','평가와 실제 배포 기록','성공한 결과와 남은 실패 · 코드와 운영 반영 구분','EVIDENCE'),
      ('자료','하나의 콘텐츠 정본','웹사이트 · README · 문서 · 발표자료 · 기획 시트','2026.11.11')
    ],'실제 제품 화면과 기술 판단은 사이트·저장소의 근거 문서에서 확인할 수 있습니다.')
    print('설명용 이미지 3종 PNG·SVG 생성')

if __name__ == '__main__':
    main()
