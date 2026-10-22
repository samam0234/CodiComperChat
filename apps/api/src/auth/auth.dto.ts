import { BadRequestException } from '@nestjs/common';

export type SignupInput = {
  email: string;
  password: string;
  displayName: string;
};
export type LoginInput = { email: string; password: string };
export type ProfileInput = { displayName: string };
export type PasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
};
export type PasswordResetInput = { token: string; newPassword: string };

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const DISPLAY_NAME_MAX = 20;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException('요청 본문이 올바르지 않습니다.');
  }
  return body as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${label}을(를) 입력해 주세요.`);
  }
  return value;
}

function email(value: unknown): string {
  const normalized = text(value, '이메일').trim().toLowerCase();
  if (normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
    throw new BadRequestException('올바른 이메일 형식이 아닙니다.');
  }
  return normalized;
}

// 길이만 맞으면 통과하던 것을 막는다. 사전 공격에서 맨 먼저 시도되는 값들(전체 목록이 아니라 최소선)
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '11111111', '00000000', '87654321', '12341234',
  'password', 'password1', 'password123', 'passw0rd', 'qwerty123', 'qwertyui', 'qwertyuiop', 'asdf1234',
  'abcd1234', 'abcdefgh', 'iloveyou', 'a1234567', '1q2w3e4r', 'zxcvbnm123', 'letmein123', 'welcome1',
]);

export function isWeakPassword(password: string, emailAddress?: string): boolean {
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return true;
  // 같은 글자만 반복(aaaaaaaa)
  if (new Set(password).size <= 2) return true;
  // 이메일 아이디와 같은 비밀번호
  const id = emailAddress?.split('@')[0]?.toLowerCase();
  return !!id && id.length >= 4 && lower === id;
}

function newPassword(value: unknown, label = '비밀번호', emailAddress?: string): string {
  const password = text(value, label);
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw new BadRequestException(
      `${label}는 ${PASSWORD_MIN}자 이상 ${PASSWORD_MAX}자 이하여야 합니다.`,
    );
  }
  if (isWeakPassword(password, emailAddress)) {
    throw new BadRequestException(`${label}가 너무 흔하거나 단순합니다. 다른 비밀번호를 써 주세요.`);
  }
  return password;
}

function displayName(value: unknown): string {
  const name = text(value, '표시 이름').trim();
  if (name.length < 1 || name.length > DISPLAY_NAME_MAX) {
    throw new BadRequestException(
      `표시 이름은 1자 이상 ${DISPLAY_NAME_MAX}자 이하여야 합니다.`,
    );
  }
  return name;
}

export function parseSignup(body: unknown): SignupInput {
  const data = asRecord(body);
  const address = email(data.email);
  return {
    email: address,
    password: newPassword(data.password, '비밀번호', address),
    displayName: displayName(data.displayName),
  };
}

// 로그인은 형식 검증을 느슨하게 둔다 — 가입 규칙이 바뀌어도 기존 계정이 막히지 않게
export function parseLogin(body: unknown): LoginInput {
  const data = asRecord(body);
  return {
    email: text(data.email, '이메일').trim().toLowerCase(),
    password: text(data.password, '비밀번호'),
  };
}

export function parseProfile(body: unknown): ProfileInput {
  return { displayName: displayName(asRecord(body).displayName) };
}

export function parsePasswordChange(body: unknown): PasswordChangeInput {
  const data = asRecord(body);
  return {
    currentPassword: text(data.currentPassword, '현재 비밀번호'),
    newPassword: newPassword(data.newPassword, '새 비밀번호'),
  };
}

export function parseEmailOnly(body: unknown): string {
  return email(asRecord(body).email);
}

export function parsePasswordReset(body: unknown): PasswordResetInput {
  const data = asRecord(body);
  return { token: text(data.token, '재설정 링크'), newPassword: newPassword(data.newPassword, '새 비밀번호') };
}
