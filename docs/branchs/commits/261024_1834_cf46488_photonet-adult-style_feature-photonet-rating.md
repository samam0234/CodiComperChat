# 성인 모드 그림체를 깔끔한 현대 애니로, 검수 오판 줄이기

| 항목 | 내용 |
|------|------|
| Subject | `fix(photonet): 성인 모드 그림체를 깔끔한 현대 애니로, 검수 오판 줄이기` |
| Full SHA | `cf46488efa510efc06c1d25115fac07e0f072d5d` |
| Short SHA | `cf46488` |
| Branch | `feature/photonet-rating` |
| Parent | `cf13fe1` (feature/photonet-scene) |
| Date | 2026-10-24T18:34:03+09:00 |

## 주 내용

- 성인 모드 인물 가중치를 (mature … adult body:1.3)에서 전체 이용가와 같은 (adult …:1.2)로 낮춤 — 늙고 사실적인 얼굴이 나오던 원인
- 애니메이션 화풍: newest 태그 추가, anime screencap 제거, detailed eyes 추가. 애니 계열 부정 프롬프트에 realistic·photorealistic·3d·old·aged·wrinkles·sketch·monochrome·crowd·background people
- 그림 검수: 확신도(confidence) 기준 제거, young은 뚜렷하게 보이는 인물만 판정, 검수 그림 크기 768px, 막은 항목을 서버 로그에 남김

## 상세

**배경**
사용자 보고("성인용 이미지가 별로다, 현대식 애니메이션 그림체라면서 이질감이 든다, 사람을 끌려면 오타쿠스러워야지").

**변경 범위**
services/ai(photonet, photonet_moderation, image_engine), docs

**기술 포인트**
- 같은 시드로 A(현재)·B(가중치 1.2)·C(미형 태그 추가) 비교: A는 주름진 늙은 얼굴, B는 깔끔한 현대 애니, C는 색감은 좋으나 두 사람 외모가 섞임 → B 기반 채택
- vibrant colors 태그는 색이 과포화돼 빼고 anime coloring·detailed eyes만 둠
- 검수 confidence는 어두운 장면에서 모든 항목 아니오인데 5를 주는 일이 잦아 같은 장면 3번 중 3번(재시도 포함)을 막음 → 기준 제거. 대신 항목 판정과 파싱 실패만 막음
- young이 배경의 작은 군중 실루엣을 어린이로 오판 → 프롬프트에서 뚜렷한 인물만 보게 하고 crowd를 부정 프롬프트에 넣음

**안 한 것**
더 미형(귀엽고 화려한) 그림체 선택지는 아직 없음 — 어려 보이는 쪽으로 쏠리지 않게 조심해야 해서 사용자 취향을 듣고 결정. 두 사람 장면에서 가끔 한 사람이 빠지는 문제는 남아 있음

## 결과

**동작 확인**
- 실제 엔진: 같은 골목 장면을 성인 모드로 3번, 모두 검수 통과하고 두 사람이 나온 깔끔한 현대 애니풍 확인
- import 검사, e2e 코디포토넷 7개 통과

**리스크**
검수 확신도 기준을 뺐으므로 gemma가 항목을 놓치면 통과할 수 있음. young 항목과 생성 쪽 부정 프롬프트·태그 정리가 막는다

**후속**
feature/photonet-scene·photonet-rating develop 병합(사용자 확인 후)

**관련 문서**
docs/guidance/photonet-engine.md, OPERATIONS.md
