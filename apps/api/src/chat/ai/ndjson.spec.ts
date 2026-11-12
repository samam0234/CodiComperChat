import { describe, expect, it } from 'vitest';
import { pushNdjson, readStreamLine } from './ndjson.js';

describe('추론 스트림 줄', () => {
  it('조각이 줄 중간에서 끊겨도 다음 조각과 이어 붙인다', () => {
    const lines: string[] = [];
    const rest = pushNdjson('', '{"delta":"안"}\n{"del', (line) => lines.push(line));
    expect(lines).toEqual(['{"delta":"안"}']);
    const done = pushNdjson(rest, 'ta":"녕"}\n', (line) => lines.push(line));
    expect(done).toBe('');
    expect(readStreamLine(lines[1]!).delta).toBe('녕');
  });

  it('끝난 줄에서 고친 답을 읽는다', () => {
    const line = readStreamLine('{"done":true,"reply":"안녕하세요"}');
    expect(line).toEqual({ done: true, reply: '안녕하세요' });
  });
});
