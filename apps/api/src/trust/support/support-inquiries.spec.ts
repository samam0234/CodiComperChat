import { BadRequestException } from '@nestjs/common';
import { parseInquiry, parseReply } from './support-inquiries.js';

describe('고객센터 문의', () => {
  it('종류·제목·내용을 다듬어 받는다', () => {
    expect(parseInquiry({ category: 'BUG', subject: '  화면이 멈춤  ', body: '  보내기를 누르면 멈춥니다.  ' })).toEqual({
      category: 'BUG',
      subject: '화면이 멈춤',
      body: '보내기를 누르면 멈춥니다.',
    });
  });

  it('종류가 없거나 제목·내용이 비면 거절한다', () => {
    expect(() => parseInquiry({ category: 'NOPE', subject: '제목', body: '내용' })).toThrow(BadRequestException);
    expect(() => parseInquiry({ category: 'OTHER', subject: '  ', body: '내용' })).toThrow(BadRequestException);
    expect(() => parseInquiry({ category: 'OTHER', subject: '제목', body: '' })).toThrow(BadRequestException);
  });

  it('빈 답변은 거절한다', () => {
    expect(() => parseReply('   ')).toThrow(BadRequestException);
    expect(parseReply('  확인했습니다.  ')).toBe('확인했습니다.');
  });
});
