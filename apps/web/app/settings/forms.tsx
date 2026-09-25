"use client";

import { useActionState } from "react";
import {
  changePassword,
  logout,
  updateProfile,
  type FormState,
} from "@/app/actions/auth";
import { saveTheme } from "@/app/actions/preferences";
import form from "@/components/form.module.css";
import styles from "./page.module.css";

function Status({ state }: { state: FormState }) {
  if (state?.error) {
    return (
      <p className={form.error} role="alert">
        {state.error}
      </p>
    );
  }
  if (state?.success) {
    return (
      <p className={form.success} role="status">
        {state.success}
      </p>
    );
  }
  return null;
}

const THEME_OPTIONS = [
  { value: "system", label: "기기 설정 따르기" },
  { value: "light", label: "밝게" },
  { value: "dark", label: "어둡게" },
];

export function ThemeForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState(saveTheme, undefined);

  return (
    <form action={action} className={form.form}>
      <fieldset className={styles.choices}>
        <legend className={form.label}>화면 테마</legend>
        {THEME_OPTIONS.map((option) => (
          <label key={option.value} className={styles.choice}>
            <input
              type="radio"
              name="theme"
              value={option.value}
              defaultChecked={current === option.value}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <Status state={state} />
      <button type="submit" className={form.secondary} disabled={pending}>
        저장
      </button>
    </form>
  );
}

export function ProfileForm({
  email,
  displayName,
}: {
  email: string;
  displayName: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className={form.form}>
      <label className={form.field}>
        <span className={form.label}>이메일</span>
        <input className={form.input} value={email} readOnly />
        <span className={form.hint}>이메일은 아직 바꿀 수 없습니다.</span>
      </label>
      <label className={form.field}>
        <span className={form.label}>표시 이름</span>
        <input
          className={form.input}
          name="displayName"
          defaultValue={state?.values?.displayName ?? displayName}
          maxLength={20}
          required
        />
      </label>
      <Status state={state} />
      <button type="submit" className={form.secondary} disabled={pending}>
        이름 저장
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  return (
    <form action={action} className={form.form}>
      <label className={form.field}>
        <span className={form.label}>현재 비밀번호</span>
        <input
          className={form.input}
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <label className={form.field}>
        <span className={form.label}>새 비밀번호</span>
        <input
          className={form.input}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />
        <span className={form.hint}>8자 이상</span>
      </label>
      <label className={form.field}>
        <span className={form.label}>새 비밀번호 확인</span>
        <input
          className={form.input}
          name="newPasswordConfirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />
      </label>
      <Status state={state} />
      <button type="submit" className={form.secondary} disabled={pending}>
        비밀번호 변경
      </button>
    </form>
  );
}

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className={form.secondary}>
        로그아웃
      </button>
    </form>
  );
}
