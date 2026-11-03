// node --test scripts/record-commit.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addRow, dateParts, fileNameOf, recordOf, titleOf } from './record-commit.mjs';

test('제목에서 type(scope)를 뗀다', () => {
  assert.equal(titleOf('feat(api): 퀘스트를 넣다'), '퀘스트를 넣다');
  assert.equal(titleOf('docs: 문서'), '문서');
  assert.equal(titleOf('merge: a into b (no-ff)'), 'a into b (no-ff)');
});

test('커밋 시각으로 파일 이름을 만든다', () => {
  const { stamp, day } = dateParts('2026-11-03 12:48:01 +0900');
  assert.equal(stamp, '261103_1248');
  assert.equal(day, '2026-11-03');
  assert.equal(fileNameOf({ stamp, short: 'abc1234', name: 'seyeon-quest', branch: 'feature/seyeon-quest' }), '261103_1248_abc1234_seyeon-quest_feature-seyeon-quest.md');
});

test('kebab-case가 아닌 이름은 거절한다', () => {
  assert.throws(() => fileNameOf({ stamp: 's', short: 'a', name: 'Bad Name', branch: 'b' }));
});

test('기록 파일은 TEMPLATE 표 형식이다', () => {
  const text = recordOf({ title: 'T', subject: 'feat: T', full: 'f', short: 's', branch: 'b', parent: 'p', date: 'd', notes: '## 주 내용\n\n- x\n' });
  assert.ok(text.startsWith('# T\n\n| 항목 | 내용 |'));
  assert.ok(text.includes('| Branch | `b` |'));
  assert.ok(text.endsWith('- x\n'));
});

test('목록의 마지막 줄 뒤에 넣고, 같은 커밋은 다시 넣지 않는다', () => {
  const index = '| a |\n| b |\n\n새 커밋 기록 md를 추가할 때마다\n';
  const row = { day: 'D', short: 'abc1234', label: 'L', title: 'T', file: 'f.md' };
  const out = addRow(index, row);
  assert.equal(out, '| a |\n| b |\n| D | `abc1234` | L | T | [f.md](commits/f.md) |\n\n새 커밋 기록 md를 추가할 때마다\n');
  assert.equal(addRow(out, row), out);
});

test('목록의 줄바꿈(CRLF)을 지킨다', () => {
  const out = addRow('| a |

새 커밋 기록 md를
', { day: 'D', short: 'abc1234', label: 'L', title: 'T', file: 'f.md' });
  assert.equal(out, '| a |
| D | `abc1234` | L | T | [f.md](commits/f.md) |

새 커밋 기록 md를
');
});
