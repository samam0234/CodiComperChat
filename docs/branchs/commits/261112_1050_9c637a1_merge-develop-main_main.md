# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `9c637a1e5a71895e8bce8665ae8e13c0a506c6f8` |
| Short SHA | `9c637a1` |
| Branch | `main` |
| Parent | `9a6421c, 865ce04` |
| Date | 2026-11-12 10:50:02 +0900 |

## 주 내용

- develop을 main에 `--no-ff`로 병합했다.
- 대화 답·추천의 한국어 맞춤법 교정과 FastAPI 기능 폴더 정리가 main에 들어간다.

## 상세

**배경**
develop에 합친 작업을 배포 브랜치에 남긴다.

**변경 범위**
develop의 `c0a9e04` 병합과 그 기록.

**기술 포인트**
가중치 학습은 없다. 교정은 출력 직전이다.

**안 한 것**
Oracle 서버 재배포는 하지 않는다.

## 결과

**동작 확인**
병합 전 단위 시험 13개 통과. 로컬 모델 4질문은 교정 전후 0/4.

**리스크**
공개 API는 이 푸시만으로 이미지가 바뀌지 않는다. 웹은 main 푸시로 먼저 나갈 수 있다.

**후속**
develop을 main에 맞춘 뒤 develop과 main을 함께 푸시한다.

**관련 문서**
[docs/trainings/korean-grammar.md](../../trainings/korean-grammar.md)
