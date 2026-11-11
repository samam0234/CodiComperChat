"""추천 질문의 답을 미리 채운다. 실행 중인 서비스에 질문을 하나씩 보내 캐시(파일)에 담게 한다.

    docker compose -f docker-compose.oracle.yml exec pf-ai python warm.py

CPU에서 질문 하나에 1분쯤 걸려 여섯 개면 6분 남짓이다. 배포 뒤 한 번만 돌리면 이후 같은 질문은 즉시 나간다.
"""
import json
import os
import sys
import time
import urllib.request

BASE = os.environ.get("WARM_URL", "http://127.0.0.1:5001")
TOKEN = os.environ.get("AI_INTERNAL_TOKEN", "")

for line in open(os.path.join(os.path.dirname(__file__), "warm_questions.txt"), encoding="utf-8"):
    q = line.strip()
    if not q:
        continue
    t0 = time.time()
    req = urllib.request.Request(
        f"{BASE}/chat",
        data=json.dumps({"message": q, "history": []}).encode("utf-8"),
        headers={"Content-Type": "application/json", "X-Internal-Token": TOKEN},
    )
    try:
        d = json.loads(urllib.request.urlopen(req, timeout=300).read())
        print(f"{round(time.time() - t0):>4}s cached={d.get('cached')} model={d.get('model')} :: {q[:40]}", flush=True)
    except Exception as e:  # 한 질문이 실패해도 나머지는 계속
        print(f"FAIL {e} :: {q[:40]}", file=sys.stderr, flush=True)
