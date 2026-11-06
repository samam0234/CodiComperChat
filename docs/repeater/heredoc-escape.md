# Git Bash heredoc 안의 이스케이프가 깨짐

<!-- logic-structure -->
## 로직 구조

```text
Bash heredoc ─▶ 파이썬 소스 ─▶ 파이썬 문자열 ─▶ 결과 파일
                 (이스케이프가 겹마다 한 번씩 풀린다 → 한 겹을 놓치면 \n이 실제 줄바꿈)
   │ 고침
   ▼
이스케이프가 든 편집은 Write·Edit 도구로 → 바로 node --check / python import / tsc
```

## 1. 환경

Windows 11, Git Bash(에이전트의 Bash 도구), `python - <<'EOF' … EOF`나 `python 파일.py`로 다른 파일을 고치는 스크립트.

## 2. 증상

고치는 스크립트 안의 파이썬 문자열 `'…\\n…'`(역슬래시+n을 넣으려던 것)이 결과 파일에서 **실제 줄바꿈**이 되었다. 결과 파일이 `SyntaxError: unterminated string literal`(파이썬)이나 `Invalid or unexpected token`(JS)으로 깨졌다. 정규식의 `\\s`, `\\n`도 같은 식으로 깨졌다. 2026-11-06에만 4번 겪었다.

## 3. 원인

따옴표 붙인 heredoc(`<<'EOF'`)은 셸이 건드리지 않지만, 여러 겹(셸 → 파이썬 소스 → 파이썬 문자열 → 결과 파일)의 이스케이프를 머릿속으로 맞추다 한 겹을 빠뜨렸다. 줄 끝 `\r\n`을 바꿔 치는 처리가 끼면 더 헷갈린다.

## 4. 해결

- 이스케이프(`\n`, `\s`, 정규식)가 들어가는 편집은 **Write·Edit 도구**로 한다. 바꿀 줄을 그대로 보이게 쓴다.
- 꼭 스크립트로 해야 하면 바꿀 내용을 별도 파일로 쓰고 그 파일을 읽어 넣는다.
- 고친 뒤 바로 문법을 확인한다.

## 5. 검증 명령

```bash
node --check scripts/readme-media/world.mjs
services/ai/.venv/Scripts/python.exe -c "import app.services.world"
npx tsc --noEmit
```
