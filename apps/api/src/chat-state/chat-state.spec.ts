import { BadRequestException } from '@nestjs/common';
import { buildContextSlice } from '../character-chat/character-chat.context.js';
import { parseStatePatch, relationshipLabel } from './chat-state.service.js';

describe('relationshipLabel', () => {
  it('구간 경계마다 이름이 바뀐다', () => {
    expect(relationshipLabel(0)).toBe('처음 만난 사이');
    expect(relationshipLabel(19)).toBe('처음 만난 사이');
    expect(relationshipLabel(20)).toBe('알아 가는 중');
    expect(relationshipLabel(40)).toBe('편한 사이');
    expect(relationshipLabel(60)).toBe('가까운 사이');
    expect(relationshipLabel(80)).toBe('각별한 사이');
    expect(relationshipLabel(100)).toBe('각별한 사이');
  });
});

describe('parseStatePatch', () => {
  it('보낸 필드만 바꾼다', () => {
    expect(parseStatePatch({ relationshipValue: 55 })).toEqual({ relationshipValue: 55 });
    expect(parseStatePatch({})).toEqual({});
  });

  it('빈 문자열·null은 지우기(null), 앞뒤 공백은 자른다', () => {
    expect(parseStatePatch({ userNickname: '  서윤아  ', relationshipNote: '' })).toEqual({
      userNickname: '서윤아',
      relationshipNote: null,
    });
    expect(parseStatePatch({ userNickname: null })).toEqual({ userNickname: null });
  });

  it('범위를 벗어나거나 형식이 틀리면 400', () => {
    for (const bad of [
      { relationshipValue: -1 },
      { relationshipValue: 101 },
      { relationshipValue: 50.5 },
      { relationshipValue: '50' },
      { userNickname: 'ㄱ'.repeat(21) },
      { relationshipNote: 'ㄱ'.repeat(201) },
      { userNickname: 3 },
    ]) {
      expect(() => parseStatePatch(bad)).toThrow(BadRequestException);
    }
  });
});

describe('컨텍스트에 상태 반영', () => {
  const character = {
    name: '유지성',
    role: 'guide',
    oneLiner: 's',
    addressing: '유저를 "학생"이라 부른다',
    personalityAxes: 'a',
    speechStyle: '존댓말',
    knows: 'k',
    unknown: 'u',
    goal: 'g',
    conflictSeed: 'c',
    openingScene: 'o',
  } as never;

  it('친밀도는 구간 이름과 메모를 근거로, 호칭은 addressAs와 addressOverride로 넘긴다', () => {
    const slice = buildContextSlice(character, [], null, null, [], {
      relationshipValue: 65,
      relationshipNote: '떡볶이 먹기로 함',
      userNickname: '서윤아',
    });
    expect(slice.state.relations).toEqual([
      { name: '친밀도(0 처음 만남 ~ 100 각별함)', value: 65, reason: '가까운 사이 — 떡볶이 먹기로 함' },
    ]);
    expect(slice.character.speech.addressAs).toBe('서윤아');
    expect(slice.addressOverride).toBe('서윤아');
  });

  it('상태가 없으면 관계는 비고 호칭은 카드 규칙 그대로', () => {
    const slice = buildContextSlice(character, [], null, null, [], null);
    expect(slice.state.relations).toEqual([]);
    expect(slice.character.speech.addressAs).toBe('유저를 "학생"이라 부른다');
    expect(slice.addressOverride).toBeNull();
  });

  it('메모가 없으면 근거는 구간 이름만', () => {
    const slice = buildContextSlice(character, [], null, null, [], {
      relationshipValue: 10,
      relationshipNote: null,
      userNickname: null,
    });
    expect(slice.state.relations[0].reason).toBe('처음 만난 사이');
    expect(slice.addressOverride).toBeNull();
  });
});
