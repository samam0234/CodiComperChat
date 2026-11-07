import { describe, expect, it } from 'vitest';
import { fixParentheticalJosa, josa } from './korean-josa.js';

describe('한국어 조사', () => {
  it('받침에 따라 이/가·은/는·을/를를 고른다', () => {
    expect(josa('이안', '이/가')).toBe('이안이');
    expect(josa('유지성', '이/가')).toBe('유지성이');
    expect(josa('세연', '이/가')).toBe('세연이');
    expect(josa('민수', '이/가')).toBe('민수가');
    expect(josa('민수', '은/는')).toBe('민수는');
    expect(josa('유지성', '을/를')).toBe('유지성을');
    expect(josa('민수', '을/를')).toBe('민수를');
    expect(josa('학교', '으로/로')).toBe('학교로');
    expect(josa('집', '으로/로')).toBe('집으로');
    expect(josa('교실', '으로/로')).toBe('교실로');
    expect(josa('유지성', '이라고/라고')).toBe('유지성이라고');
    expect(josa('민수', '이라고/라고')).toBe('민수라고');
  });

  it('괄호로 남긴 조사를 문장 안에서 고친다', () => {
    expect(fixParentheticalJosa('유지성이(가) 잘 하고 있나요?')).toBe('유지성이 잘 하고 있나요?');
    expect(fixParentheticalJosa('민수는(은) 학생이다')).toBe('민수는 학생이다');
    expect(fixParentheticalJosa('이안이(가) 이겼다')).toBe('이안이 이겼다');
    expect(fixParentheticalJosa('그냥 문장')).toBe('그냥 문장');
  });
});
