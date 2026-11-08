# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `3dae4e28ed7327f593bf226b78479c273de7a593` |
| Short SHA | `3dae4e2` |
| Branch | `main` |
| Parent | `fb6116c, a7658a6` |
| Date | 2026-11-08 10:01:30 +0900 |

## 주 내용

- develop을 main에 `--no-ff`로 병합했다.
- 살아있는 문서 정합이 main에 들어왔다.
- 화면 코드와 모델 호출 코드는 바뀌지 않았다.

## 상세

**배경**
사용자가 develop에서 main까지 병합한 뒤 푸시하라고 했다.

**변경 범위**
문서와 README. 기획 원본은 그대로다.

**기술 포인트**
충돌 없이 ort로 합쳐졌다. Vercel은 main을 웹으로 배포할 수 있으나 이번 차이는 문서다.

**안 한 것**
Oracle 이미지 재시작, 강화 무료 클라우드 경로, 모델 평가 재실행.

## 결과

**동작 확인**
병합 충돌은 없었다. 시험은 돌리지 않았다.

**리스크**
main 푸시가 Vercel 웹 재배포를 일으킬 수 있다. API 서버 이미지는 이 푸시만으로 바뀌지 않는다.

**후속**
develop과 main을 origin에 푸시한다.

**관련 문서**
[docs/STATUS.md](../../../docs/STATUS.md), [docs/branchs/commits/261108_1001_e7fb83e_merge-docs-refine-into-develop_develop.md](../261108_1001_e7fb83e_merge-docs-refine-into-develop_develop.md)
