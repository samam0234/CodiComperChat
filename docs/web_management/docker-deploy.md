# Compose 배포 절차 (TBD)

> `docker-compose.yml`이 아직 없다. 실제 파일이 생기면 이 문서를 진짜 절차로 교체한다. 목표 서비스 구성은 [../Architecture/docker-topology.md](../Architecture/docker-topology.md) 참고.

## 목표 절차

```bash
docker compose pull
docker compose up -d --build
docker compose ps
```

## 확인할 것 (목표)

- web, api, ai(GPU), postgres 모두 healthy (Redis는 쓰지 않는다). ai가 그림 엔진을 읽는지(`GET /photonet/status` ready), 콘솔은 바깥에 열리지 않았는지
- 웹에서 `/infer`가 노출되지 않는지 (Nest만 접근 가능해야 함)
