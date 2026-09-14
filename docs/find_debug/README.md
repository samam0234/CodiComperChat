# 디버그 일지

그날그날 잡은 버그·원인·해결을 남기는 곳. `repeater/`가 "재발 가능한 인프라 지식 베이스"라면, 여기는 **일지**다.

## 규칙

1. 파일명 `YYYY-MM-DD.md` (하루 단위로 추가/갱신)
2. 이슈마다 **증상 / 원인 / 해결 / 재발 방지**
3. 재현 명령은 코드 블록으로

## 흐름

find_debug(일지)에서 정제된 내용이, 다시 터질 수 있는 이슈라면 [../repeater/](../repeater/)로, 포트/배포 이슈라면 [../web_management/ports-inventory.md](../web_management/ports-inventory.md)로 옮겨진다.

아직 코드가 없어 기록된 항목이 없다. 첫 디버깅이 생기면 이 폴더에 `YYYY-MM-DD.md`를 추가한다.
