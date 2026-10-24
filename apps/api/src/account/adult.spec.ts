import { adultBlock, ageOn, parseBirthDate } from './adult.js';

const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe('성인 확인', () => {
  it('만 나이는 한국 시각 생일 기준', () => {
    // 2026-10-24 00:30 KST = 2026-10-23 15:30 UTC
    const now = new Date('2026-10-23T15:30:00Z');
    expect(ageOn(d('2007-10-24'), now)).toBe(19);
    expect(ageOn(d('2007-10-25'), now)).toBe(18);
    expect(ageOn(d('2000-01-01'), now)).toBe(26);
  });

  it('이메일 인증·생년월일·만 19세·동의를 차례로 본다', () => {
    const now = new Date('2026-10-24T03:00:00Z');
    const ok = { birthDate: d('2000-05-05'), adultConsentAt: now, emailVerifiedAt: now };
    expect(adultBlock(ok, now)).toBeNull();
    expect(adultBlock({ ...ok, emailVerifiedAt: null }, now)).toBe('EMAIL_UNVERIFIED');
    expect(adultBlock({ ...ok, birthDate: null }, now)).toBe('NO_BIRTHDATE');
    expect(adultBlock({ ...ok, birthDate: d('2008-01-01') }, now)).toBe('UNDERAGE');
    expect(adultBlock({ ...ok, adultConsentAt: null }, now)).toBe('NO_CONSENT');
  });

  it('생년월일은 YYYY-MM-DD의 실제 날짜만', () => {
    expect(parseBirthDate('2000-02-29')?.toISOString().slice(0, 10)).toBe('2000-02-29');
    expect(parseBirthDate('2001-02-29')).toBeNull();
    expect(parseBirthDate('2000-13-01')).toBeNull();
    expect(parseBirthDate('20000101')).toBeNull();
    expect(parseBirthDate(undefined)).toBeNull();
  });
});
