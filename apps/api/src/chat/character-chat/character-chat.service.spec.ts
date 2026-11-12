import { describe, expect, it, vi } from 'vitest';
import { postToAi } from '../ai/ai-client.js';
import { CharacterChatService } from './character-chat.service.js';

vi.mock('../../account/auth/session.js', () => ({ readSession: vi.fn().mockResolvedValue('user') }));
vi.mock('../ai/ai-client.js', () => ({
  postToAi: vi.fn().mockResolvedValue({ suggestions: [] }),
  getFromAi: vi.fn(),
  streamFromAi: vi.fn(),
}));

function setup() {
  const persona = { id: 'persona', name: '민준', description: '카페 손님' };
  const character = {
    id: 'character', name: '지우', role: 'guide', oneLiner: '카페 주인',
    speechStyle: '존댓말', addressing: '손님', personalityAxes: '차분함',
    knows: '커피', unknown: '손님의 과거', goal: '카페 운영', conflictSeed: '', openingScene: '어서 오세요.',
  };
  const characters = { findOnePublished: vi.fn().mockResolvedValue(character) };
  const conversations = {
    find: vi.fn().mockResolvedValue(null),
    recentTurns: vi.fn().mockResolvedValue([
      { role: 'user', text: '고양이 이름은 보리예요.' },
      { role: 'character', text: '보리, 기억할게요.' },
    ]),
  };
  const state = { get: vi.fn().mockResolvedValue({ relationshipValue: 30, relationshipNote: '단골', userNickname: '민준' }) };
  const story = { get: vi.fn().mockResolvedValue({ openHooks: [], closedEvents: [], brief: '금요일 서점 약속' }) };
  const service = new CharacterChatService(
    characters as never,
    { findOwned: vi.fn().mockResolvedValue(persona) } as never,
    { assemble: vi.fn().mockReturnValue(null) } as never,
    conversations as never,
    { forContext: vi.fn().mockResolvedValue([]) } as never,
    state as never,
    { activeFor: vi.fn().mockResolvedValue([]) } as never,
    story as never,
    {} as never,
    {} as never,
    { user: { findUnique: vi.fn().mockResolvedValue(null) } } as never,
  );
  return { service, persona, conversations, characters, state, story };
}

describe('캐릭터 대화 준비 캐시', () => {
  it('첫 요청 뒤 생긴 대화와 최신 요약·관계 상태를 다음 요청에 반영한다', async () => {
    const { service, persona, conversations, characters } = setup();
    await service.suggest('character', [], { personaId: persona.id });
    conversations.find.mockResolvedValue({ campaignId: 'campaign', sessionId: 'session', persona } as never);
    await service.suggest('character', [], { personaId: persona.id });

    const payload = vi.mocked(postToAi).mock.calls.at(-1)?.[1] as {
      context: { recentTurns: { text: string }[]; storySoFar: string; addressOverride: string };
    };
    expect(payload.context.recentTurns[0].text).toBe('고양이 이름은 보리예요.');
    expect(payload.context.storySoFar).toBe('금요일 서점 약속');
    expect(payload.context.addressOverride).toBe('민준');
    expect(characters.findOnePublished).toHaveBeenCalledTimes(1);
  });

  it('캐시가 있어도 다른 프로필로 고정된 대화이면 거절한다', async () => {
    const { service, persona, conversations } = setup();
    await service.suggest('character', [], { personaId: persona.id });
    conversations.find.mockResolvedValue({ campaignId: 'campaign', sessionId: 'session', persona: { ...persona, id: 'other' } } as never);
    await expect(service.suggest('character', [], { personaId: persona.id })).rejects.toThrow('고정된 프로필');
  });
});
