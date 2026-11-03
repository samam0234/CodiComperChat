# 백업과 복구

대상은 PostgreSQL이다(계정·캐릭터·대화·코레딧·그림). 볼륨 `personas`(페르소나 지식 JSON)는 발행하면 공방이 다시 만들 수 있지만, 함께 복사해 두면 빠르다. 체크포인트와 Ollama 모델은 다시 받을 수 있어 백업하지 않는다.

## 백업

```bash
scripts/db-backup.sh
# cron (서버에서 하루 한 번)
0 4 * * * /srv/codicomperchat/scripts/db-backup.sh >> /var/log/codicomperchat-backup.log 2>&1
```

- `deploy/backups/`(git 제외, 권한 700)에 `날짜_시각.dump`로 남긴다. `BACKUP_DIR`로 바꿀 수 있다
- 14일 지난 파일은 지운다(`BACKUP_KEEP_DAYS`)
- 덤프를 `pg_restore --list`로 읽어 본 뒤에만 파일 이름을 확정한다. 망가진 덤프를 백업으로 남기지 않는다
- **같은 서버에만 두면 서버를 잃을 때 함께 잃는다.** 업체의 스냅샷이나 다른 저장소로 복사하는 일은 호스팅을 정한 뒤 추가한다(아직 없음)

덤프에는 이메일·비밀번호 해시·대화가 들어 있다. 암호화되지 않은 곳으로 옮기지 않는다.

## 복구

1. 다른 서비스를 멈춘다: `docker compose ... stop web console api`
2. 덤프를 넣고 복구한다

```bash
docker cp deploy/backups/<파일>.dump codicomperchat-postgres-1:/tmp/r.dump
docker exec codicomperchat-postgres-1 sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner /tmp/r.dump; rm /tmp/r.dump'
```

3. 다시 띄운다: `docker compose ... up -d`. 코드가 덤프보다 새로우면 `migrate`가 남은 마이그레이션을 적용한다

## 연습 기록

| 날짜 | 내용 | 결과 |
|------|------|------|
| 2026-11-03 | 운영 compose를 띄워 `db-backup.sh`로 덤프(156KB) → 같은 컨테이너의 새 DB로 `pg_restore` | 공식 캐릭터 2, 계정 1, 적용된 마이그레이션 33개가 그대로 나옴 |

운영 데이터가 생긴 뒤에는 분기마다 한 번, 새 DB에 복구해 행 수를 비교한다. 위 3단계의 `--clean` 복구는 운영 DB를 지우므로 연습에는 쓰지 않는다. 연습에서는 `createdb`로 만든 새 DB에 넣는다.
