import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveText } from './live-text.ts';

function setup() {
  let next = 0;
  const frames = new Map();
  const shown = [];
  const output = liveText(
    (text) => shown.push(text),
    (callback) => { frames.set(++next, callback); return next; },
    (id) => frames.delete(id),
  );
  return { output, shown, frames };
}

test('첫 글자를 즉시 표시하고 완료 때 남은 글자를 전부 표시한다', () => {
  const { output, shown, frames } = setup();
  output.append('안녕하세요.');
  assert.equal(shown[0], '안');
  assert.equal(frames.size, 1);
  output.append(' 반가워요.');
  output.finish();
  assert.equal(shown.at(-1), '안녕하세요. 반가워요.');
  assert.equal(frames.size, 0);
});

test('진행 중 교정은 이전 대기 글자와 예약 프레임을 지운다', () => {
  const { output, shown, frames } = setup();
  output.append('이전 대사');
  output.replace('교정한 대사');
  output.finish();
  assert.equal(shown.at(-1), '교정한 대사');
  assert.equal(frames.size, 0);
});

test('프레임을 따라 글자가 이어지고 취소 후 예약 표시가 남지 않는다', () => {
  const { output, shown, frames } = setup();
  output.append('안녕🙂 반가워요.');
  while (frames.size) {
    const [id, callback] = frames.entries().next().value;
    frames.delete(id);
    callback();
  }
  assert.equal(shown.at(-1), '안녕🙂 반가워요.');
  output.append(' 다음 대사');
  output.dispose();
  assert.equal(frames.size, 0);
});
