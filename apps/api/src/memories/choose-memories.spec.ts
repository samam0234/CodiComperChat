import { describe, expect, it } from 'vitest';
import { chooseMemories } from './choose-memories.js';

const row = (id: string, content: string, pinned = false) => ({
  id,
  content,
  pinned,
  createdAt: new Date(0),
});

describe('chooseMemories', () => {
  it('벡터가 고른 기억과 직접 적은 기억만 남긴다', () => {
    const all = [
      row('p', '직접 적은 약속', true),
      row('a', '민준은 새벽 달리기를 한다'),
      row('b', '민준은 고양이를 키운다'),
    ];
    const chosen = chooseMemories(all, { message: '달리기', recent: [] }, ['민준은 새벽 달리기를 한다']);
    expect(chosen.map((item) => item.text)).toEqual(['직접 적은 약속', '민준은 새벽 달리기를 한다']);
  });

  it('벡터가 없으면 적은 자동 기억은 그대로 둔다', () => {
    const all = [row('a', '민준은 새벽 달리기를 한다')];
    const chosen = chooseMemories(all, { message: '안녕', recent: [] }, null);
    expect(chosen.map((item) => item.id)).toEqual(['a']);
  });
});
