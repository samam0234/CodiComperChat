# .gitattributes 추가로 줄바꿈과 바이너리 처리 명시

| 항목 | 내용 |
|------|------|
| Subject | `chore(git): .gitattributes 추가로 줄바꿈과 바이너리 처리 명시` |
| Full SHA | `a371c1c01f6a40772dfd46ffc7a061a491e8b326` |
| Short SHA | `a371c1c` |
| Branch | `feature/gitattributes` |
| Parent | `f1a2c07` (develop) |
| Date | 2026-10-22T23:35:09+09:00 |

## 주 내용

- 저장소 루트에 .gitattributes 추가: * text=auto (저장소는 LF, 작업 사본은 기기 설정 따름)
- 이미지·글꼴·압축 파일 등 바이너리는 binary로 지정해 줄바꿈 변환과 diff를 막음
- 셸 스크립트(*.sh)는 eol=lf로 고정

## 상세

**배경**
사용자 요청("저장소 루트에 .gitattributes 파일을 생성")에 따라 만들었다. 인덱스는 모두 LF인데 Windows 작업 사본은 CRLF(core.autocrlf=true)라서 커밋할 때마다 줄바꿈 경고가 나왔다.

**변경 범위**
.gitattributes (루트)

**기술 포인트**
- eol을 지정하지 않아 Windows는 CRLF, 리눅스·CI는 LF로 받는다 (지금 작업 방식 그대로)
- 확인: git status에 가짜 변경이 없음, favicon.ico는 binary, 텍스트는 text=auto

**안 한 것**
기존 파일의 줄바꿈 일괄 정규화(필요 없음, text=auto가 비교 시 맞춰 줌)

## 결과

**동작 확인**
- git status 깨끗함(.gitattributes만 추가)
- git check-attr로 텍스트·바이너리·sh 규칙 확인

**리스크**
없음 (이후 커밋부터 경고가 사라짐)

**후속**
없음

**관련 문서**
없음
