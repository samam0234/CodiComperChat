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

function newPassword(value: unknown, label = '비밀번호'): string {
  const password = text(value, label);
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw new BadRequestException(
      `${label}는 ${PASSWORD_MIN}자 이상 ${PASSWORD_MAX}자 이하여야 합니다.`,
    );
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
  return {
    email: email(data.email),
    password: newPassword(data.password),
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
