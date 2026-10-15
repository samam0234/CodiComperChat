import { groundingText, ungroundedTopics } from './grounding.js';

describe('개인사 질문 가드', () => {
  const card = { oneLiner: '과외하는 대학생', knows: '유저의 성적', profile: { occupation: '대학생' } };
  const text = groundingText(null, card);

  it('설정에 없는 개인사 주제를 물으면 걸린다', () => {
    expect(ungroundedTopics('취미가 뭐예요?', text)).toEqual(['취미·좋아하는 것']);
    expect(ungroundedTopics('나이가 몇 살이에요?', text)).toEqual(['나이·생일']);
    expect(ungroundedTopics('혹시 반려동물 키우세요?', text)).toEqual(['반려동물']);
    expect(ungroundedTopics('형제 있으세요? 고향은요?', text)).toEqual(['가족·형제', '고향·사는 곳']);
  });

  it('설정에 근거가 있는 주제는 걸리지 않는다 (검색이 사실을 넘긴다)', () => {
    // "대학생"이라는 말만으로는 어느 학교인지 알 수 없다 → 근거 아님
    expect(ungroundedTopics('어느 대학 다니세요?', text)).toEqual(['학교·학력·직장']);
    expect(ungroundedTopics('어느 대학 다니세요?', groundingText(null, { knows: '한빛대학교 수학과 재학 중' }))).toEqual([]);
    const withHobby = groundingText(null, { ...card, knows: '취미는 등산, 반려견 한 마리' });
    expect(ungroundedTopics('취미가 뭐예요?', withHobby)).toEqual([]);
    expect(ungroundedTopics('강아지 키우세요?', withHobby)).toEqual([]);
  });

  it('개인사와 관계없는 말은 걸리지 않는다', () => {
    expect(ungroundedTopics('오늘 수학 진도 어디까지예요?', text)).toEqual([]);
    expect(ungroundedTopics('커피 키우는 법 알아요', text)).toEqual(['반려동물']); // 오탐은 단정을 막는 쪽으로만 틀린다
  });

  it('지식 파일의 안전장치 조각은 근거로 치지 않는다', () => {
    const knowledge = {
      schemaVersion: 1,
      character: 'x',
      core: ['x: 과외 선생'],
      chunks: [
        { id: 'guard-unwritten', type: 'boundary', topic: '설정에 없는 개인사', keywords: [], text: '취미·가족은 설정에 없다' },
        { id: 'card-knows', type: 'knowledge', topic: '아는 것', keywords: [], text: '성적' },
      ],
    };
    expect(ungroundedTopics('취미가 뭐예요?', groundingText(knowledge, {}))).toEqual(['취미·좋아하는 것']);
  });
});
