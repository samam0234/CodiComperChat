import { buildSheet, draftSpec, normalizeDraft } from './draft-fields.js';
import { fullCard } from './card.fixture.js';

describe('AI 초안 칸', () => {
  it('지원하지 않는 칸(비밀·해금 조건·예시 대화·이름)은 400', () => {
    for (const key of ['boundary.secret', 'boundary.unlockCondition', 'greeting.examples', 'identity.name', 'nope', undefined]) {
      expect(() => draftSpec(key)).toThrow(/지원하지 않는 칸/);
    }
    expect(draftSpec('campaign.scene')).toMatchObject({ kind: 'text', max: 400 });
  });

  it('설정 줄에는 비밀·해금 조건이 어떤 칸을 쓰든 들어가지 않는다', () => {
    const card = fullCard();
    const sheet = buildSheet(card, 'campaign.scene').join('\n');
    expect(sheet).not.toContain(card.boundary.secret);
    expect(sheet).not.toContain(card.boundary.unlockCondition);
    expect(sheet).toContain('이름: 한지우');
    expect(sheet).toContain('말투: 존댓말');
  });

  it('쓰는 칸 자체는 설정 줄에서 뺀다', () => {
    const card = fullCard();
    const sheet = buildSheet(card, 'campaign.scene').join('\n');
    expect(sheet).not.toContain(card.campaign.scene);
    expect(sheet).toContain(card.campaign.knows);
  });

  it('텍스트는 상한에 맞춰 문장 끝에서 자르고 서식을 지운다', () => {
    const spec = draftSpec('identity.oneLiner');
    const long = '골목 끝 카페를 혼자 꾸리는 바리스타다. 그리고 아주 오래전부터 이 동네에서 살아왔다.';
    const out = normalizeDraft(spec, { text: `**${long}**` }) as string;
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out).not.toContain('*');
  });

  it('목록은 번호·기호를 떼고 중복을 지우고 개수 상한을 지킨다', () => {
    const spec = draftSpec('personality.habits');
    const out = normalizeDraft(spec, { items: ['- 말끝을 흐린다', '1. 말끝을 흐린다', '* 비유로 설명한다', '손을 만지작거린다', '하나 더'] });
    expect(out).toEqual(['말끝을 흐린다', '비유로 설명한다', '손을 만지작거린다']);
  });
});
