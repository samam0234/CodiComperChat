#!/usr/bin/env bash
# Oracle Cloud Always Free ARM VM(Ubuntu 22.04·24.04)을 백엔드를 올릴 수 있는 상태로 만든다. root로 한 번 돌린다. 여러 번 돌려도 된다.
# 실제 VM에서 돌려 본 적이 없다(2026-11-06, 문법 검사만 함). 처음 돌릴 때 출력을 읽는다.
# 하는 일: 스왑 4GB, 도커, Tailscale, 80·443 열기(Oracle 이미지의 iptables 규칙), 부팅 시 도커 시작.
# 콘솔의 VCN 보안 목록(Security List)에서도 80·443을 따로 열어야 한다 (안내 HTML 2단계).
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "root로 돌린다: sudo bash deploy/oracle/setup.sh" >&2
  exit 1
fi

. /etc/os-release
if [ "${ID:-}" != "ubuntu" ]; then
  echo "Ubuntu 전용이다 (지금: ${ID:-모름})" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# 스왑: 12GB에서 api 이미지 빌드(npm ci)가 메모리를 크게 쓴다
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update
apt-get install -y ca-certificates curl gnupg iptables-persistent git
install -m 0755 -d /etc/apt/keyrings

# 도커 (공식 저장소, ARM64도 같다)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker

# Tailscale (AI 노드와 잇는 사설망). 로그인은 사람이 한다: sudo tailscale up
if ! command -v tailscale >/dev/null 2>&1; then
  curl -fsSL https://tailscale.com/install.sh | sh
fi
systemctl enable --now tailscaled

# Oracle Ubuntu 이미지는 iptables에 "22 말고 모두 거절" 규칙이 들어 있다. ufw를 쓰지 말고 이 규칙 앞에 80·443을 넣는다
for port in 80 443; do
  if ! iptables -C INPUT -p tcp -m state --state NEW --dport "$port" -j ACCEPT 2>/dev/null; then
    iptables -I INPUT 5 -p tcp -m state --state NEW --dport "$port" -j ACCEPT
  fi
done
netfilter-persistent save

echo
echo "끝. 다음:"
echo "  1) sudo tailscale up      (출력된 주소로 로그인)"
echo "  2) Oracle 콘솔 > VCN > Security List에서 TCP 80·443 인바운드 허용"
echo "  3) docs/web_management/deploy-guide.html 4단계"
