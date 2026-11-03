#!/usr/bin/env bash
# 새 GPU 서버(Ubuntu 22.04·24.04)를 배포할 수 있는 상태로 만든다. root로 한 번 돌린다. 여러 번 돌려도 된다.
# 실제 서버에서 돌려 본 적이 없다(서버 계약 전, 문법 검사만 함). 처음 돌릴 때 출력을 읽는다.
# 하는 일: 도커, NVIDIA 드라이버·컨테이너 런타임, 부팅 시 도커 시작, 방화벽(SSH·80·443만).
# 다음 할 일은 docs/web_management/docker-deploy.md "처음 설치".
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "root로 돌린다: sudo bash deploy/server-setup.sh" >&2
  exit 1
fi

. /etc/os-release
if [ "${ID:-}" != "ubuntu" ]; then
  echo "Ubuntu 전용이다 (지금: ${ID:-모름})" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg ufw ubuntu-drivers-common
install -m 0755 -d /etc/apt/keyrings

# 도커 (공식 저장소)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

# NVIDIA 컨테이너 런타임 (공식 저장소)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey -o /etc/apt/keyrings/nvidia-container.asc
chmod a+r /etc/apt/keyrings/nvidia-container.asc
echo "deb [signed-by=/etc/apt/keyrings/nvidia-container.asc] https://nvidia.github.io/libnvidia-container/stable/deb/\$(ARCH) /" \
  > /etc/apt/sources.list.d/nvidia-container-toolkit.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin nvidia-container-toolkit

# 드라이버가 이미 있으면 건너뛴다
if ! command -v nvidia-smi >/dev/null 2>&1; then
  ubuntu-drivers install
  NEEDS_REBOOT=1
fi

nvidia-ctk runtime configure --runtime=docker
systemctl enable --now docker
systemctl restart docker

# 바깥에는 SSH와 80·443만. 나머지 서비스는 compose가 포트를 열지 않는다
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

if [ "${NEEDS_REBOOT:-0}" = "1" ]; then
  echo "드라이버를 새로 넣었다. 재부팅한 뒤 아래 확인을 돌린다."
fi
echo "확인: docker run --rm --gpus all ubuntu nvidia-smi"
