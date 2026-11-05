# README 그림·영상 만들기

루트 README의 스크린샷, GIF, MP4를 **실제로 띄운 앱**에서 다시 만드는 도구다. 결과는 `docs/assets/readme/`에 저장한다.

| 파일 | 하는 일 |
|------|---------|
| `env.mjs` | 포트·경로·출력 폴더 |
| `servers.mjs` | 데모 전용 DB를 새로 만들고 AI·API·웹·콘솔을 데모 포트로 띄운다 |
| `art.mjs` | 배너·기술 스택·구조도·대화 한 턴 그림·제목 카드를 HTML에서 PNG로 만든다 |
| `capture.mjs` | 데모 계정으로 화면을 돌며 스크린샷을 남긴다 |
| `tour.mjs` | 앞에서 만든 데이터로 소개 영상을 녹화한다 |
| `build.mjs` | 녹화에 자막을 입혀 MP4·GIF를 만든다 |

```bash
# 사전: PostgreSQL, Ollama(gemma4:e4b), 그림 엔진, npm run test:e2e가 만든 .next-e2e·dist-verify 빌드
node scripts/readme-media/servers.mjs      # 켜 둔다 (3201·3202·4201·8201)
node scripts/readme-media/art.mjs
node scripts/readme-media/capture.mjs      # 그림을 실제로 그린다. 2026-11-06에 약 10분
npx playwright install ffmpeg              # 녹화 도구, 처음 한 번
node scripts/readme-media/tour.mjs
FFMPEG=<H.264 인코더가 있는 ffmpeg 경로> node scripts/readme-media/build.mjs
```

데모 DB(`codicomperchat_readme`)와 임시 파일(`e2e/.tmp/readme-media`)은 개발 DB·개발 서버와 겹치지 않는다. `servers.mjs`는 켤 때마다 데모 DB를 지우고 새로 만든다. 계정은 `example.com` 주소의 가짜 계정이고, 대답과 그림은 실제 모델이 만든 것이다. 성인 모드는 끈 상태(`ADULT_MODE=off`)로 찍는다.
