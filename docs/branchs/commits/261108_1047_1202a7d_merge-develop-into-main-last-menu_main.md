# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `1202a7dec837f6586dee4993245498d06b250e59` |
| Short SHA | `1202a7d` |
| Branch | `main` |
| Parent | `212b23e, 8e7b2b9` |
| Date | 2026-11-08 10:47:00 +0900 |

## 주 내용

- develop을 main에 `--no-ff`로 병합했다.
- 마지막 대사만 점 세 개 메뉴로 고치는 변경이 main에 들어왔다.

## 상세

**배경**
사용자가 develop에서 main까지 병합한 뒤 푸시하라고 했다.

**변경 범위**
대화 화면과 API 제한, 안내 문서. 화면 외 기능은 없다.

**기술 포인트**
충돌 없이 ort로 합쳐졌다.

**안 한 것**
Oracle 이미지는 다시 올리지 않았다.

## 결과

**동작 확인**
병합 충돌은 없었다. 로컬 화면에서 마지막 줄에만 메뉴가 있는 것을 확인했다.

**리스크**
main 푸시가 Vercel 웹 재배포를 일으킬 수 있다. API 서버 이미지는 이 푸시만으로 바뀌지 않는다.

**후속**
develop과 main을 origin에 푸시한다.

**관련 문서**
[docs/FEATURES.md](../../../docs/FEATURES.md)
