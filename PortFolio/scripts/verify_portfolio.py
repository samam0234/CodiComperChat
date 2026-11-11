"""생성된 사이트·API·다운로드·RAG의 실제 연결을 검사한다. build 뒤 실행."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import hashlib
import json

PF=Path(__file__).resolve().parents[1]
DIST=PF/'frontend/dist'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    src=PF/'shared/content/portfolio.json'
    c=json.loads(src.read_text(encoding='utf-8'))
    for dest in [PF/'frontend/src/data/portfolio.json',PF/'server/backend/data/portfolio.json']:
        assert digest(src)==digest(dest),f'콘텐츠 복사본 불일치: {dest}'
    for name in ('sheets.json','erd.json'):
        src=PF/'shared/data'/name
        for folder in ['frontend/src/data','server/backend/data']:
            assert digest(src)==digest(PF/folder/name),f'데이터 불일치: {folder}/{name}'
    for f in (PF/'PortFile').glob('*'):
        if f.suffix not in ('.pdf','.docx','.pptx','.xlsx'):
            continue
        name='CodiComperChat_planning.xlsx' if f.suffix=='.xlsx' else f.name
        assert digest(f)==digest(PF/'frontend/public/files'/name),f'다운로드 복사본 불일치: {name}'
        assert digest(f)==digest(DIST/'files'/name),f'빌드 다운로드 불일치: {name}'
    class Links(HTMLParser):
        def handle_starttag(self,tag,attrs):
            a=dict(attrs)
            for attr in ('href','src'):
                raw=a.get(attr,'')
                u=urlparse(raw)
                if not raw.startswith('/') or u.netloc:
                    continue
                p=DIST/unquote(u.path.lstrip('/'))
                assert p.is_file() or (p/'index.html').is_file(),f'없는 링크: {raw}'
    html=list(DIST.rglob('*.html'))
    expected={'/','/chat','/files','/data','/erd'}|{'/'+t['slug'] for t in c['toc']}
    for route in expected:
        assert (DIST/route.lstrip('/')/'index.html').is_file(),f'없는 페이지: {route}'
    for page in html:
        Links().feed(page.read_text(encoding='utf-8'))
    rag=(PF/'server/ai_services/knowledge/portfolio.md').read_text(encoding='utf-8')
    assert '호스팅 SSE' in rag and '프레임워크' in rag and '서버 반영' in rag
    print(f'정적 {len(html)}페이지 · 경로/이미지 · 다운로드 4종 · 정본/데이터 복사본 · RAG 동기화 확인')

if __name__=='__main__':
    main()
