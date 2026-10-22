# .agents/ 스킬 허브

이 폴더는 여러 AI 에이전트 도구(Claude, Grok, Cursor, Codex, Antigravity …)가 공통으로 참조하는 **정본 규칙**을 담는다.

```text
.agents/
├── AGENTS.md                          # 진입 지시 (여기부터 읽기 시작)
├── README.md                          # 이 파일
└── skills/
    └── codicomperchat/
        └── SKILL.md                  # 정본 스킬 (전체 규칙)
```

도구별 폴더(`.claude/`, `.cursor/`, `.codex/`, `.grok/`, `.antigravity/`)는 이 정본을 가리키거나 요약 복제한 어댑터다. 규칙을 바꿀 때는 이 폴더와 루트 `AGENTS.md`를 먼저 고치고, 어댑터는 그 다음에 맞춘다.
