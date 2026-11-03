// 성인 확인 (코디포토넷 NSFW). 생년월일 + 동의 + 이메일 인증. 본인인증은 하지 않는다.
// 2026-10-25 결정: 이 방식을 유지한다. 본인인증(PASS 등) 도입은 법률 검토 항목으로 남긴다.
// 청소년보호법의 청소년은 만 19세 미만 — 만 나이로 19세 이상만 성인으로 본다(한국 시각 기준 날짜).
export const ADULT_AGE = 19;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 오늘(한국 시각) 기준 만 나이
export function ageOn(birthDate: Date, now: Date = new Date()): number {
  const today = new Date(now.getTime() + KST_OFFSET_MS);
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export type AdultFields = { birthDate: Date | null; adultConsentAt: Date | null; emailVerifiedAt: Date | null };

// 성인 콘텐츠를 볼 수 있나. 안 되면 이유를 코드로 (화면이 안내 문구를 고른다)
export type AdultBlock = 'EMAIL_UNVERIFIED' | 'NO_BIRTHDATE' | 'UNDERAGE' | 'NO_CONSENT';

export function adultBlock(user: AdultFields, now: Date = new Date()): AdultBlock | null {
  if (!user.emailVerifiedAt) return 'EMAIL_UNVERIFIED';
  if (!user.birthDate) return 'NO_BIRTHDATE';
  if (ageOn(user.birthDate, now) < ADULT_AGE) return 'UNDERAGE';
  if (!user.adultConsentAt) return 'NO_CONSENT';
  return null;
}

export const ADULT_BLOCK_MESSAGE: Record<AdultBlock, string> = {
  EMAIL_UNVERIFIED: '성인 콘텐츠는 이메일 인증을 마친 계정에서만 쓸 수 있어요.',
  NO_BIRTHDATE: '설정에서 성인 확인(생년월일·동의)을 먼저 해 주세요.',
  UNDERAGE: '만 19세 이상만 성인 콘텐츠를 볼 수 있어요.',
  NO_CONSENT: '설정에서 성인 콘텐츠 보기에 동의해 주세요.',
};

// "YYYY-MM-DD" → Date(UTC 자정). 형식이 틀리거나 없는 날이면 null
export function parseBirthDate(raw: unknown): Date | null {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw ? null : date;
}
