#!/usr/bin/env bash
# Oracle VM에서 AI 서버(ai + ollama)를 한 번에 올리고 확인한다. 여러 번 돌려도 된다.
#
#   bash deploy/oracle/ai-deploy.sh        # 전체: 키 → 스왑 → 올리기 → 예비 모델 → 확인
#   bash deploy/oracle/ai-deploy.sh key    # 키만 넣고 검사한다
#
# 보통은 PC에서 `node scripts/deploy-ai-oracle.mjs`가 코드를 올린 뒤 이 스크립트를 부른다.
# 키(nvapi-…)는 .env에 없을 때만 물어보고(화면에 안 보임), 어디에도 출력하지 않는다.
# 설명서: docs/web_management/ai-deploy-handover.html
set -uo pipefail

MODE="${1:-all}"
if [ "$(id -u)" -ne 0 ]; then exec sudo -E bash "$0" "$@"; fi

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../.."
ENV_FILE="$HERE/.env"
NIM_BASE="${NIM_BASE:-https://integrate.api.nvidia.com/v1}"
DEFAULT_MODEL="google/gemma-4-31b-it"
FAILS=()
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

say()  { printf '%s\n' "$*"; }
ok()   { printf '  ✓ %s\n' "$*"; }
warn() { printf '  ! %s\n' "$*"; }
bad()  { printf '  ✗ %s\n' "$*"; }
die()  { printf '\n  ✗ %s\n\n' "$*" >&2; exit 1; }

env_get() { grep -m1 "^$1=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true; }
env_set() {
  [ -n "$(tail -c1 "$ENV_FILE")" ] && printf '\n' >> "$ENV_FILE"
  sed -i "/^$1=/d" "$ENV_FILE"
  printf '%s=%s\n' "$1" "$2" >> "$ENV_FILE"
}

say "== 코디컴퍼챗 AI 서버 배포 =="

say "[1/6] 사전 점검"
[ -f "$ENV_FILE" ] || die "백엔드 설정 파일이 없다($ENV_FILE). 백엔드 배포(oracle-backend.md)를 먼저 한다."
command -v docker >/dev/null || die "docker가 없다. 백엔드 배포를 먼저 한다."
command -v python3 >/dev/null || die "python3가 없다."
[ -f "$HERE/docker-compose.ai.yml" ] || die "docker-compose.ai.yml이 없다. 코드를 다시 올린다."
ok "docker, .env, compose 파일 확인"

# ── 키 ────────────────────────────────────────────────────────────────
# 결과: NIM_STATUS(http 코드). 모델 ID 목록에서 Gemma 4 31B를 찾아 MODEL에 둔다
pick_model() {
  MODEL="$(env_get LLM_API_MODEL)"; [ -n "$MODEL" ] || MODEL="$DEFAULT_MODEL"
  local code
  code="$(curl -s -m 25 -o "$TMP/models.json" -w '%{http_code}' "$NIM_BASE/models" 2>/dev/null)" || code=000
  if [ "$code" = 200 ]; then
    local found
    found="$(python3 - "$TMP/models.json" "$MODEL" <<'PY'
import json, sys
ids = [m.get("id", "") for m in json.load(open(sys.argv[1])).get("data", [])]
want = sys.argv[2]
cand = [i for i in ids if "gemma-4-31b" in i]
if want in ids: print(want)
elif cand: print(sorted(cand, key=lambda i: (not i.endswith("-it"), i))[0])
PY
)"
    if [ -n "$found" ]; then MODEL="$found"; else
      warn "NVIDIA 모델 목록에 Gemma 4 31B가 없다. 이름이 바뀌었을 수 있다."
      python3 - "$TMP/models.json" <<'PY' | sed 's/^/      /'
import json, sys
print("gemma 계열:", ", ".join(m["id"] for m in json.load(open(sys.argv[1])).get("data", []) if "gemma" in m.get("id", "")) or "없음")
PY
    fi
  else
    warn "모델 목록을 못 받았다(HTTP $code). 기본 이름 $MODEL 로 시험한다."
  fi
}

# 0=통과, 1=키 거절, 2=그 밖의 실패(모델 이름·네트워크·한도)
check_key() {
  local code
  code="$(curl -s -m 60 -o "$TMP/chat.json" -w '%{http_code}' \
    -H "Authorization: Bearer $1" -H 'Content-Type: application/json' \
    -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}],\"max_tokens\":8}" \
    "$NIM_BASE/chat/completions" 2>/dev/null)" || code=000
  NIM_STATUS="$code"
  case "$code" in
    200) return 0 ;;
    401|403) return 1 ;;
    *) return 2 ;;
  esac
}

say "[2/6] NVIDIA 키"
KEY="$(env_get LLM_API_KEY)"
[[ "$KEY" == nvapi-* ]] || KEY=""
pick_model
for attempt in 1 2 3; do
  if [ -z "$KEY" ]; then
    [ -t 0 ] || die "키가 .env에 없고 입력할 터미널도 없다. 직접 연 터미널에서 'node scripts/deploy-ai-oracle.mjs --key-only'를 먼저 실행한다."
    read -rsp "  NVIDIA 키(nvapi-로 시작)를 붙여 넣고 Enter (화면에 안 보임): " KEY; echo
    KEY="${KEY//[[:space:]]/}"
    if [[ "$KEY" != nvapi-* ]]; then bad "nvapi-로 시작하지 않는다 ($attempt/3)"; KEY=""; continue; fi
  fi
  check_key "$KEY"; rc=$?
  if [ $rc -eq 0 ]; then ok "키 확인됨 (모델 $MODEL, HTTP 200)"; break; fi
  if [ $rc -eq 1 ]; then
    bad "NVIDIA가 키를 거절했다(HTTP $NIM_STATUS). build.nvidia.com에서 키를 새로 만들어 붙여 넣는다 ($attempt/3)"; KEY=""
  else
    case "$NIM_STATUS" in
      404) die "모델 $MODEL 을 NVIDIA에서 찾지 못했다(HTTP 404). 위 gemma 목록을 보고 .env의 LLM_API_MODEL을 고친다." ;;
      429) warn "한도에 걸렸다(HTTP 429). 키는 유효해 보여 계속한다."; break ;;
      *)   die "NVIDIA에 연결하지 못했다(HTTP $NIM_STATUS). 서버 인터넷·잠시 후 재시도를 확인한다." ;;
    esac
  fi
done
[ -n "$KEY" ] || die "키 확인에 실패했다. 키를 새로 만들어 다시 실행한다."

env_set LLM_BACKEND openai
env_set LLM_API_KEY "$KEY"
env_set LLM_API_MODEL "$MODEL"
env_set AI_CONCURRENCY 2
env_set OLLAMA_MODEL gemma4:e4b
unset KEY
ok ".env에 저장 (키 값은 출력하지 않음)"

if [ "$MODE" = key ]; then
  say ""; say "키 설정 끝. 이제 'node scripts/deploy-ai-oracle.mjs'로 전체 배포를 한다."; exit 0
fi

# ── 스왑 ──────────────────────────────────────────────────────────────
say "[3/6] 메모리·스왑"
if [ -z "$(swapon --show --noheadings 2>/dev/null)" ]; then
  if fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile; then
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ok "스왑 4GB를 만들었다"
  else
    warn "스왑을 못 만들었다. 램이 부족하면 예비 모델이 죽을 수 있다"
  fi
fi
free -h | awk '/Mem:|Swap:/ {printf "  · %s 전체 %s, 사용 %s\n", $1, $2, $3}'

# ── 올리기 ────────────────────────────────────────────────────────────
C=(docker compose --env-file "$ENV_FILE" -f "$HERE/docker-compose.yml" -f "$HERE/docker-compose.ai.yml")
say "[4/6] 컨테이너 빌드·시작 (처음엔 3~10분. API가 한 번 다시 켜져 수십 초 끊긴다)"
"${C[@]}" up -d --build >"$TMP/up.log" 2>&1 || { tail -n 25 "$TMP/up.log"; die "docker compose up 실패. 위 로그를 보낸다."; }
ok "컨테이너 시작"
for _ in $(seq 1 40); do
  st="$(docker inspect -f '{{.State.Health.Status}}' "$("${C[@]}" ps -q ai 2>/dev/null)" 2>/dev/null)"
  [ "$st" = healthy ] && break
  sleep 5
done
if [ "${st:-}" = healthy ]; then ok "ai 컨테이너 healthy"; else bad "ai가 healthy가 되지 않았다 (상태: ${st:-없음})"; FAILS+=("ai 컨테이너"); "${C[@]}" logs --tail=15 ai 2>&1 | sed 's/^/      /'; fi

say "[5/6] 예비 모델 gemma4:e4b (CPU)"
if "${C[@]}" exec -T ollama ollama list 2>/dev/null | grep -q 'gemma4:e4b'; then
  ok "이미 받아져 있다"
else
  say "  받는 중 (수 GB, 몇 분)…"
  if "${C[@]}" exec -T ollama ollama pull gemma4:e4b >"$TMP/pull.log" 2>&1; then ok "받았다"; else tail -n 5 "$TMP/pull.log"; bad "모델 받기 실패"; FAILS+=("예비 모델 받기"); fi
fi

# ── 확인 ──────────────────────────────────────────────────────────────
say "[6/6] 확인"
if "${C[@]}" exec -T api node -e "fetch('http://ai:8000/health',{headers:{'x-ai-token':process.env.AI_SERVICE_TOKEN}}).then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))" >/dev/null 2>&1; then
  ok "api → ai 내부 호출 통과 (토큰 인증)"
else
  bad "api → ai 내부 호출 실패"; FAILS+=("api → ai 호출")
fi

probe() { # $1=llm 함수 이름, $2=제한 시간(초)
  timeout "${2:-120}" "${C[@]}" exec -T ai python - "$1" <<'PY'
import sys, time
from app.services import llm
fn = getattr(llm, sys.argv[1])
kw = dict(system="한국어로 한 문장만 답한다.", contents=[llm.turn("user", "안녕")], max_output_tokens=60,
          temperature=0.3, response_json_schema=None, seed=None)
if sys.argv[1] == "_generate_ollama":
    kw.update(model=None, keep_alive=None)
t = time.time()
try:
    out = fn(**kw)
    print("%.1f초 | %s" % (time.time() - t, out.strip().replace("\n", " ")[:70]))
except Exception as e:
    print(getattr(e, "detail", None) or e); sys.exit(1)
PY
}
if out="$(probe _generate_openai 2>&1)"; then ok "NVIDIA 응답: $out"; else bad "NVIDIA 경로 실패: $out"; FAILS+=("NVIDIA 응답"); fi
if out="$(probe _generate_ollama 300 2>&1)"; then ok "예비(CPU) 응답: $out"; else warn "예비(CPU) 응답 실패: $out (NVIDIA가 막힐 때만 문제)"; fi

say ""
if [ ${#FAILS[@]} -eq 0 ]; then
  say "== 완료: 모두 통과 =="
  say "다음: Vercel 웹에서 캐릭터와 대화해 본다. 답이 몇 초~수십 초 안에 오면 끝."
else
  say "== 일부 실패: ${FAILS[*]} =="
  say "위 ✗ 줄과 로그를 그대로 알려 준다. (되돌리기: docker compose ... stop ai ollama)"
  exit 1
fi
