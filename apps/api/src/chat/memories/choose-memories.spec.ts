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

  it('삭제된 기억의 벡터는 되살리지 않고 현재 기억으로 검색한다', () => {
    const chosen = chooseMemories(
      [row('a', '고양이 이름은 보리다')],
      { message: '고양이 이름', recent: [] },
      ['고양이 이름은 나비다'],
    );
    expect(chosen).toEqual([{ id: 'a', text: '고양이 이름은 보리다' }]);
  });

  it('현재 기억과 삭제된 기억이 함께 검색되어도 현재 기억만 쓴다', () => {
    const chosen = chooseMemories(
      [row('a', '금요일에 만난다')],
      { message: '약속', recent: [] },
      ['토요일에 만난다', '금요일에 만난다'],
    );
    expect(chosen).toEqual([{ id: 'a', text: '금요일에 만난다' }]);
  });
});
