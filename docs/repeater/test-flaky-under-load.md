# 시험이 가끔 실패하는데 혼자 돌리면 늘 통과

## 1. 환경

local (Windows). 개발 서버·e2e·다른 빌드가 같이 돌아 PC가 바쁠 때

## 2. 증상

`npm run test:api`가 가끔 1개 실패하고, 바로 다시 돌리면 수십 번 통과한다. 실패 메시지가 `Test timeout of 5000ms` 또는 시간·순서에 관한 단언(`expected 61 to be ≤ 60` 등)

## 3. 원인 (지금까지 나온 것)

- 시험 안에서 처음 불러오는 모듈(`await import(...)`)이 바쁠 때 5초를 넘는다
- 시험이 "몇 ms 안에"를 가정한다(짧은 창을 기다리기, 첫 DB 연결 시간)
- 동시에 몰릴 때만 드러나는 실제 버그(트랜잭션 시각 `now()` 등) — 시험이 맞고 코드가 틀린 경우도 있다

## 4. 해결

- 불러오기는 파일 맨 위 `import`로
- 시간이 지나기를 기다리지 말고 상태를 직접 만든다(예: DB에서 창 끝 시각을 과거로 바꾸기)
- 연결은 `beforeAll`에서 미리 연다
- 재현됐는데 시험 가정이 맞다면 코드를 고친다

## 5. 검증 명령

같은 시험을 3개 동시에, 여러 번 돌려 실패를 모은다:

```bash
cd apps/api
for i in 1 2 3 4 5; do
  for j in a b c; do npx vitest run --reporter=json --outputFile=../../e2e/.tmp/vt-$i$j.json >/dev/null 2>&1 & done; wait
done
node -e "const fs=require('fs');const d='../../e2e/.tmp';for(const f of fs.readdirSync(d).filter(x=>x.startsWith('vt-'))){const r=JSON.parse(fs.readFileSync(d+'/'+f));for(const t of r.testResults)for(const a of t.assertionResults)if(a.status==='failed')console.log(f,a.fullName,a.duration)}"
```

실패가 없고, 가장 느린 시험이 제한(5초)보다 충분히 작으면 된다.

관련: [../find_debug/2026-10-16.md](../find_debug/2026-10-16.md)
