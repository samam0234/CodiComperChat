// node --test scripts/adapters.test.mjs
// 도구별 에이전트 어댑터가 정본을 가리키고, 규칙 목록이 서로 어긋나지 않는지 본다.
// 새 도구를 더하면 아래 ADAPTERS에 한 줄 넣는다. 규칙을 바꿀 때는 .codex/AGENTS.md의 목록을 기준으로 모든 어댑터를 같이 고친다.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CANON = '.agents/skills/codicomperchat/SKILL.md';

// 폴더 → 규칙 파일(도구가 읽는 이름). skills/ 안의 포인터는 모든 폴더가 같다
const ADAPTERS = {
  '.codex': 'AGENTS.md',
  '.antigravity': 'AGENTS.md',
  '.grok': 'rules/codicomperchat.md',
  '.gemini': 'GEMINI.md',
  '.manus': 'AGENTS.md',
  '.kimi': 'AGENTS.md',
  '.ollama': 'AGENTS.md',
  '.opencode': 'AGENTS.md',
  '.qwen': 'QWEN.md',
  '.windsurf': 'rules/codicomperchat.md',
};
// 스킬 포인터까지 있는 어댑터 (.antigravity는 규칙 파일만 둔다)
const WITH_SKILL = Object.keys(ADAPTERS).filter((d) => d !== '.antigravity');

const read = (path) => readFileSync(join(ROOT, path), 'utf8').replace(/\r\n/g, '\n');
const bulletsOf = (text) => text.split('\n').filter((line) => line.startsWith('- '));

test('정본이 있다', () => {
  assert.ok(existsSync(join(ROOT, CANON)));
});

for (const [dir, rule] of Object.entries(ADAPTERS)) {
  test(`${dir}: 규칙 파일이 정본을 가리킨다`, () => {
    const text = read(`${dir}/${rule}`);
    assert.ok(text.includes(CANON), `${dir}/${rule}에 정본 경로가 없다`);
    assert.ok(text.includes('CodiComperChat_project_plan.md'), `${dir}/${rule}에 §0 원본 보존 원칙이 없다`);
  });
}

for (const dir of WITH_SKILL) {
  test(`${dir}: 스킬 포인터가 정본을 가리킨다`, () => {
    const text = read(`${dir}/skills/codicomperchat/SKILL.md`);
    assert.ok(text.includes(CANON));
    assert.ok(!text.includes('## '), '포인터에는 규칙 본문을 복제하지 않는다');
  });
}

// .codex의 목록과 같아야 하는 어댑터: 규칙을 그대로 복제한 것들 (.cursor·.claude는 도구별로 문장이 달라 제외)
const SAME_AS_CODEX = Object.keys(ADAPTERS).filter((d) => d !== '.codex');
for (const dir of SAME_AS_CODEX) {
  test(`${dir}: 규칙 목록이 .codex와 같다`, () => {
    assert.deepEqual(bulletsOf(read(`${dir}/${ADAPTERS[dir]}`)), bulletsOf(read('.codex/AGENTS.md')));
  });
}

test('기본 규칙이 빠지지 않았다', () => {
  const list = bulletsOf(read('.codex/AGENTS.md')).join('\n');
  for (const must of ['원본 보존', '--no-ff', 'docs/branchs/commits', '개발 서버', 'services/ai/models', 'docs/trainings']) {
    assert.ok(list.includes(must), `${must} 규칙이 없다`);
  }
});
