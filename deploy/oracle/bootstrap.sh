#!/usr/bin/env bash
# Oracle VM(Ubuntu 24.04 ARM)에서 한 번 붙여넣어 실행하는 부트스트랩: 준비 → 레포 받기 → 값 묻기 → 백엔드 올리기.
# 실제 VM에서 돌려 본 적이 없다(2026-11-06, 문법 검사만 함). 출력을 읽으며 진행한다. 여러 번 돌려도 된다(.env가 있으면 재사용).
#
#   curl -fsSL https://raw.githubusercontent.com/samam0234/CodiComperChat/claude/project-thread-po3i10/deploy/oracle/bootstrap.sh | sudo -E bash
#
# 비밀값(DB 비밀번호·토큰·무료 API 키)은 이 VM 안에서만 만들거나 입력한다. 채팅·커밋에 적지 않는다.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/samam0234/CodiComperChat.git}"
BRANCH="${BRANCH:-claude/project-thread-po3i10}"
TARGET_USER="${SUDO_USER:-ubuntu}"
APP_DIR="${APP_DIR:-/home/${TARGET_USER}/CodiComperChat}"

if [ "$(id -u)" -ne 0 ]; then
  echo "root로 돌린다: sudo -E bash bootstrap.sh" >&2
  exit 1
fi

# 파이프로 받아 돌릴 때도 키보드 입력을 받는다
ask() { # ask 변수 "질문" [기본값] [secret]
  local __var="$1" __q="$2" __def="${3:-}" __secret="${4:-}" __val=""
  if [ -r /dev/tty ]; then
    if [ -n "$__secret" ]; then read -r -s -p "$__q " __val </dev/tty; echo >/dev/tty
    else read -r -p "$__q ${__def:+[$__def] }" __val </dev/tty; fi
  fi
  printf -v "$__var" '%s' "${__val:-$__def}"
}

echo "== 1/5 기본 도구와 레포 =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y >/dev/null
apt-get install -y git curl openssl >/dev/null
if [ ! -d "$APP_DIR/.git" ]; then
  if ! sudo -u "$TARGET_USER" git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"; then
    echo "레포를 받지 못했다. 비공개 레포면 GitHub 토큰이 필요하다(이 창에만 입력, 화면에 안 보임)." >&2
    ask GH_TOKEN "GitHub 토큰(읽기 권한, 없으면 Enter로 중단):" "" secret
    [ -n "$GH_TOKEN" ] || exit 1
    sudo -u "$TARGET_USER" git clone --branch "$BRANCH" "https://x-access-token:${GH_TOKEN}@github.com/samam0234/CodiComperChat.git" "$APP_DIR"
    sudo -u "$TARGET_USER" git -C "$APP_DIR" remote set-url origin "$REPO_URL"
    unset GH_TOKEN
  fi
else
  sudo -u "$TARGET_USER" git -C "$APP_DIR" fetch origin "$BRANCH" && sudo -u "$TARGET_USER" git -C "$APP_DIR" checkout "$BRANCH" && sudo -u "$TARGET_USER" git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi

echo "== 2/5 VM 준비(스왑·도커·Tailscale·방화벽) =="
bash "$APP_DIR/deploy/oracle/setup.sh"
usermod -aG docker "$TARGET_USER" || true

echo "== 3/5 설정값 =="
ENV_FILE="$APP_DIR/deploy/oracle/.env"
PUBLIC_IP="$(curl -fsS --max-time 8 http://169.254.169.254/opc/v1/vnics/ 2>/dev/null | grep -o '"publicIp" *: *"[0-9.]*"' | head -1 | grep -o '[0-9.]\{7,\}' || true)"
[ -n "$PUBLIC_IP" ] || PUBLIC_IP="$(curl -fsS --max-time 8 https://api.ipify.org || true)"
echo "이 VM의 공인 IP: ${PUBLIC_IP:-알 수 없음}"

if [ -f "$ENV_FILE" ]; then
  echo ".env가 이미 있다. 그대로 쓴다: $ENV_FILE"
else
  DEFAULT_DOMAIN=""
  [ -n "$PUBLIC_IP" ] && DEFAULT_DOMAIN="${PUBLIC_IP//./-}.sslip.io"
  echo "API 주소: 도메인이 없으면 Enter(공인 IP로 만든 무료 주소 ${DEFAULT_DOMAIN:-없음}를 쓴다). 도메인이 있으면 A 레코드가 위 IP를 가리켜야 한다."
  ask API_DOMAIN "API 도메인" "$DEFAULT_DOMAIN"
  ask ACME_EMAIL "인증서 알림 메일" "admin@${API_DOMAIN}"
  ask WEB_BASE_URL "Vercel 웹 주소(모르면 Enter, 나중에 고친다)" "https://codicomperchat-web.vercel.app"
  ask LLM_API_BASE "무료 LLM API 주소" "https://integrate.api.nvidia.com/v1"
  ask LLM_API_MODEL "무료 LLM 모델 이름" "google/gemma-4-31b-it"
  ask LLM_API_KEY "무료 LLM API 키(없으면 Enter: 이 VM의 CPU 모델만 쓴다. 입력은 화면에 안 보임)" "" secret
  ask MAIL_SMTP_URL "메일 SMTP 주소(예: smtps://user:pass@smtp.example.com:465, 없으면 Enter: 메일이 발송되지 않는다)" "" secret
  [ -n "$MAIL_SMTP_URL" ] || MAIL_SMTP_URL="smtp://localhost:25"
  ask MAIL_FROM "보내는 사람" "코디컴퍼챗 <no-reply@${API_DOMAIN}>"

  rnd() { openssl rand -hex "$1"; }
  if [ -n "$LLM_API_KEY" ]; then BACKEND=openai; else BACKEND=ollama; fi
  umask 077
  cp "$APP_DIR/deploy/oracle/.env.example" "$ENV_FILE"
  setv() { # 키=값 한 줄을 안전하게 바꾼다(값에 / & 가 있어도 된다)
    local k="$1" v="$2"
    python3 - "$ENV_FILE" "$k" "$v" <<'PY'
import sys,re
p,k,v=sys.argv[1:4]
lines=open(p,encoding='utf-8').read().split('\n')
out=[];done=False
for l in lines:
    if re.match(r'^'+re.escape(k)+r'=',l) and not done:
        out.append(f'{k}={v}');done=True
    else: out.append(l)
if not done: out.append(f'{k}={v}')
open(p,'w',encoding='utf-8').write('\n'.join(out))
PY
  }
  setv API_DOMAIN "$API_DOMAIN"; setv ACME_EMAIL "$ACME_EMAIL"; setv WEB_BASE_URL "$WEB_BASE_URL"
  setv WEB_PROXY_TOKEN "$(rnd 24)"; setv POSTGRES_PASSWORD "$(rnd 16)"
  setv AUTH_SECRET "$(rnd 32)"; setv AI_SERVICE_TOKEN "$(rnd 32)"
  setv LLM_BACKEND "$BACKEND"; setv LLM_API_BASE "$LLM_API_BASE"; setv LLM_API_MODEL "$LLM_API_MODEL"; setv LLM_API_KEY "$LLM_API_KEY"
  setv MAIL_SMTP_URL "$MAIL_SMTP_URL"; setv MAIL_FROM "$MAIL_FROM"
  chown "$TARGET_USER":"$TARGET_USER" "$ENV_FILE"; chmod 600 "$ENV_FILE"
  echo ".env를 만들었다(권한 600): $ENV_FILE"
fi

getv() { grep -m1 "^$1=" "$ENV_FILE" | cut -d= -f2-; }  # .env를 source하지 않는다(MAIL_FROM의 < > 때문)
API_DOMAIN="$(getv API_DOMAIN)"; LLM_BACKEND="$(getv LLM_BACKEND)"; LLM_API_KEY="$(getv LLM_API_KEY)"; OLLAMA_MODEL="$(getv OLLAMA_MODEL)"
if [ "${LLM_BACKEND:-}" = "openai" ] && [ -n "${LLM_API_KEY:-}" ]; then PROFILE=free-api; else PROFILE=cpu-ai; fi
PROFILE="${PROFILES:-$PROFILE}"

echo "== 4/5 백엔드 올리기(프로필 $PROFILE, 첫 빌드는 10~20분) =="
cd "$APP_DIR"
docker compose --env-file "$ENV_FILE" -f deploy/oracle/docker-compose.yml --profile "$PROFILE" up -d --build
if [ "$PROFILE" = "cpu-ai" ] || [ "$PROFILE" = "fallback" ]; then
  docker compose --env-file "$ENV_FILE" -f deploy/oracle/docker-compose.yml exec -T ollama ollama pull "${OLLAMA_MODEL:-gemma4:e4b}"
fi

echo "== 5/5 확인 =="
for i in $(seq 1 30); do
  if curl -fsS --max-time 10 "https://${API_DOMAIN}/health" >/dev/null 2>&1; then OK=1; break; fi
  sleep 10
done
docker compose --env-file "$ENV_FILE" -f deploy/oracle/docker-compose.yml ps
echo
if [ "${OK:-0}" = "1" ]; then echo "성공: https://${API_DOMAIN}/health 가 응답한다."; else
  echo "아직 https://${API_DOMAIN}/health 가 응답하지 않는다. 확인할 것:"
  echo "  - Oracle 콘솔 Security List에 TCP 80·443 인바운드(규칙 2개)를 넣었는가"
  echo "  - docker compose -f deploy/oracle/docker-compose.yml logs caddy api"
fi
echo
echo "---- Vercel 웹 프로젝트에 넣을 값 ----"
echo "API_BASE_URL=https://${API_DOMAIN}"
echo "WEB_PROXY_TOKEN은 아래 파일의 값을 그대로 복사한다(채팅에 붙이지 않는다):"
echo "  grep '^WEB_PROXY_TOKEN=' $ENV_FILE"
