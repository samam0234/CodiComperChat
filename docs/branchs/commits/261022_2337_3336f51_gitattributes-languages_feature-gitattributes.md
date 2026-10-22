# .gitattributes에 언어별·파일명별 규칙 보강

| 항목 | 내용 |
|------|------|
| Subject | `chore(git): .gitattributes에 언어별·파일명별 규칙 보강` |
| Full SHA | `3336f51be7952ab8f35b46d189739e3ff2b8cf5d` |
| Short SHA | `3336f51` |
| Branch | `feature/gitattributes` |
| Parent | `d991293` (feature/gitattributes) |
| Date | 2026-10-22T23:37:16+09:00 |

## 주 내용

- 언어별 소스를 text로 명시: TypeScript·JavaScript(ts tsx mts cts js jsx mjs cjs), Python(py pyi), CSS·HTML·SVG, 문서(md mdx mdc txt), 데이터·설정(json yml toml sql prisma env example)
- 파일명으로 지정: .gitignore .prettierrc .editorconfig .env.example Dockerfile docker-compose.yml package.json package-lock.json tsconfig*.json requirements*.txt
- git 내장 diff 드라이버: python·css·html·markdown·bash
- 스크립트 줄바꿈: *.sh eol=lf, *.bat *.cmd *.ps1 eol=crlf
- 바이너리 확장: 이미지(avif 포함)·글꼴·압축·미디어·wasm·pyc·sqlite·db
- GitHub 언어 통계: package-lock.json과 docs/branchs/commits/**는 generated, docs/**는 documentation

## 상세

**배경**
사용자 요청(".gitattributes 안에 좀 더 강력한 언어 파일명 추가")에 따라 앞 커밋의 최소 규칙을 이 프로젝트가 실제로 쓰는 언어·파일명 기준으로 보강했다. 추적 파일의 확장자 분포(md 263·ts 196·tsx 84·py 42·css 42·sql 23·mjs 15·json 14)를 보고 정했다.

**변경 범위**
.gitattributes

**기술 포인트**
- eol은 여전히 지정하지 않아 Windows는 CRLF, 리눅스·CI는 LF로 받는다. eol을 못 박은 것은 실행되는 곳의 규칙이 있는 스크립트와 Dockerfile뿐
- git에 내장된 diff 드라이버만 썼다(ts·tsx·sql에는 내장이 없어 지정하지 않음)
- 뒤의 규칙이 앞을 덮어쓰므로 text=auto를 맨 앞에 두고 구체적인 규칙을 뒤에 둠

**안 한 것**
없음

## 결과

**동작 확인**
- git add --renormalize로 실제 스테이징해 확인: .gitattributes 외 변경 0개 (확인 뒤 git reset으로 되돌림)
- git check-attr로 ts·py·css·md·prisma·sh·ps1·ico·package-lock.json 규칙이 의도대로 적용됨
- 텍스트로 분류되지 않은 추적 파일은 favicon.ico 하나뿐

**리스크**
없음 (기존 파일 내용은 그대로, 이후 새 파일에만 적용)

**후속**
develop 병합

**관련 문서**
없음
