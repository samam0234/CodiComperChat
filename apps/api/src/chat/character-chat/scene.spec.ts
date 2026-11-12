import { describe, expect, it } from 'vitest';
import { noticeScene } from './scene.js';

const empty = { time: null, place: null };

describe('장면의 때와 곳', () => {
  it('시각과 장소를 고르고, 단서가 없으면 이전 값을 둔다', () => {
    expect(noticeScene('저녁에 카페에 도착했어', empty)).toEqual({ time: '저녁', place: '카페' });
    expect(noticeScene('네, 알겠어요', { time: '저녁', place: '카페' })).toEqual({ time: '저녁', place: '카페' });
  });

  it('시간: 장소: 표기를 우선한다', () => {
    expect(noticeScene('시간: 다음 날 오전\n장소: 옥상', empty)).toEqual({ time: '다음 날 오전', place: '옥상' });
  });

  it('시 분 표기를 읽는다', () => {
    expect(noticeScene('지금 7시 30분이야', empty).time).toBe('7시 30분');
  });
});
