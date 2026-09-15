# services/ai

코디컴퍼챗 추론·요약 엔진. FastAPI (Python).

**이 서비스는 내부망 전용이다.** `apps/api`(Nest)만 호출하고, 웹은 직접 호출하지 않는다 (기획서 §7.1).

```bash
cd services/ai

# 최초 1회
py -3.12 -m venv .venv                      # Windows
python3.12 -m venv .venv                    # macOS/Linux
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
./.venv/bin/python -m pip install -r requirements.txt           # macOS/Linux

# 실행
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

- 대화형 API 문서: `http://localhost:8000/docs`
- 엔드포인트 현황: [../../docs/API_DOCUMENTATION.md](../../docs/API_DOCUMENTATION.md)
- 모델 전략: [../../docs/plan/AI_MODEL_STRATEGY.md](../../docs/plan/AI_MODEL_STRATEGY.md)

## 현재 상태 (뼈대)

| 경로 | 현재 |
|------|------|
| `GET /health` | 200 |
| `POST /infer` | 501 미구현 |
| `POST /summarize` | 501 미구현 |
| `POST /critique-test` | 501 미구현 |
| `POST /train`, `GET /train/{job_id}` | **403 — v1에서 의도적으로 차단** |

`/train`의 403은 미구현이 아니라 정책이다. v1은 자체 가중치 학습을 하지 않고 경로만 설계에 남긴다 (기획서 §7.7).

## 주의

- 이 서비스는 npm workspaces 밖이다 (Python). 루트 `npm install`로 설치되지 않는다.
- 원본 DB에 직접 접근하지 않는다. 추론에 필요한 슬라이스는 Nest가 조립해서 넘긴다 (기획서 §7.4).
