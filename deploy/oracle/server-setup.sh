#!/usr/bin/env bash
# Oracle Cloud Ubuntu 24.04(ARM, GPU 없음)를 백엔드 배포 상태로 만든다. root로 돌린다. 여러 번 돌려도 된다.
# 하는 일: 도커 설치, 부팅 시 도커 시작, deploy/oracle/.env가 없으면 비밀값을 새로 만들어 채운다(화면에 찍지 않는다).
# 방화벽: Oracle 이미지의 iptables는 INPUT을 막지만, 도커가 연 포트(80·443)는 FORWARD로 가서 영향이 없다.
#         바깥 문은 Oracle 콘솔의 보안 목록(Security List)에서 80·443을 연다.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "root로 돌린다: sudo bash deploy/oracle/server-setup.sh" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
if ! command -v docker >/dev/null 2>&1; then
  apt-get update
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

HERE="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$HERE/.env"
if [ ! -f "$ENV_FILE" ]; then
  secret() { openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-64; }
  sed \
    -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(secret)|" \
    -e "s|^AUTH_SECRET=.*|AUTH_SECRET=$(secret)|" \
    -e "s|^AI_SERVICE_TOKEN=.*|AI_SERVICE_TOKEN=$(secret)|" \
    "$HERE/.env.example" > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "만들었다: $ENV_FILE (비밀값은 화면에 찍지 않는다)"
fi
echo "다음: docker compose --env-file $ENV_FILE -f $HERE/docker-compose.yml up -d --build"
