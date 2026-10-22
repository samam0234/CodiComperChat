import { PORTRAIT_MAX_BYTES, parsePortrait } from './portrait.js';

const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(20)]);
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20)]);
const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(20)]);

describe('초상 이미지 검사', () => {
  it('png·jpeg·webp를 받는다', () => {
    expect(parsePortrait('image/png', png).mime).toBe('image/png');
    expect(parsePortrait('image/jpeg', jpeg).mime).toBe('image/jpeg');
    expect(parsePortrait('image/webp; charset=binary', webp).mime).toBe('image/webp');
  });
  it('다른 형식·형식 없음은 400', () => {
    for (const type of ['image/gif', 'image/svg+xml', 'text/html', undefined]) {
      expect(() => parsePortrait(type, png)).toThrow(/webp·jpeg·png/);
    }
  });
  it('선언한 형식과 파일 내용이 다르면 400 (그림인 척하는 파일)', () => {
    expect(() => parsePortrait('image/png', Buffer.from('<script>alert(1)</script>'.padEnd(30, ' ')))).toThrow(/형식이 맞지/);
    expect(() => parsePortrait('image/webp', jpeg)).toThrow(/형식이 맞지/);
  });
  it('비었거나 상한을 넘으면 400', () => {
    expect(() => parsePortrait('image/png', Buffer.alloc(0))).toThrow(/비어/);
    expect(() => parsePortrait('image/png', undefined)).toThrow(/비어/);
    expect(() => parsePortrait('image/png', Buffer.concat([png, Buffer.alloc(PORTRAIT_MAX_BYTES)]))).toThrow(/KB 이하/);
  });
});
