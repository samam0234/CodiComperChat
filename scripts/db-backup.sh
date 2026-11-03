#!/usr/bin/env bash
# 운영 DB 백업. 서버의 cron에 하루 한 번 건다. 보관 기간이 지난 파일은 지운다.
#   0 4 * * * /srv/codicomperchat/scripts/db-backup.sh >> /var/log/codicomperchat-backup.log 2>&1
# 복구 절차와 연습 기록: docs/web_management/backup-restore.md
#
# 환경변수: BACKUP_DIR(기본 deploy/backups), BACKUP_KEEP_DAYS(기본 14), COMPOSE_PROJECT(기본 codicomperchat)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${BACKUP_DIR:-$ROOT/deploy/backups}"
KEEP="${BACKUP_KEEP_DAYS:-14}"
CONTAINER="${COMPOSE_PROJECT:-codicomperchat}-postgres-1"

mkdir -p "$DIR"
chmod 700 "$DIR"
FILE="$DIR/$(date +%Y%m%d_%H%M%S).dump"

# 컨테이너 안의 값으로 접속한다 (비밀번호가 프로세스 목록에 나오지 않는다)
docker exec "$CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$FILE.tmp"
# 덤프가 온전한지 목록을 읽어 확인한 뒤에만 이름을 바꾼다
docker exec -i "$CONTAINER" pg_restore --list < "$FILE.tmp" > /dev/null
mv "$FILE.tmp" "$FILE"
chmod 600 "$FILE"

find "$DIR" -name '*.dump' -mtime "+$KEEP" -delete
echo "$(date '+%F %T') 백업 완료: $FILE ($(du -h "$FILE" | cut -f1))"
