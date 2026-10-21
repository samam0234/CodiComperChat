"use client";

import { useActionState } from "react";
import {
  changePassword,
  deleteAccount,
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
  { value: "auto", label: "시간에 따라 자동", hint: "오전 7시~오후 10시 밝게, 밤에는 어둡게" },
  { value: "light", label: "밝기 모드 영구 설정", hint: "시간과 상관없이 언제나 밝게" },
  { value: "dark", label: "다크 모드 영구 설정", hint: "시간과 상관없이 언제나 어둡게" },
];

export function ThemeForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState(saveTheme, undefined);

  return (
    <form action={action} className={form.form}>
      <fieldset className={styles.choices}>
        <legend className={form.label}>화면 테마</legend>
        <div className={styles.themeGrid}>
          {THEME_OPTIONS.map((option) => (
            <label key={option.value} className={styles.themeCard}>
              <input
                type="radio"
                name="theme"
                value={option.value}
                defaultChecked={current === option.value}
              />
              {/* 미리보기: 밝은 면과 어두운 면. 자동은 반반 */}
              <span className={`${styles.swatch} ${styles[`swatch_${option.value}`]}`} aria-hidden="true">
                <span />
                <span />
              </span>
              <span className={styles.themeLabel}>{option.label}</span>
              <span className={styles.themeHint}>{option.hint}</span>
            </label>
          ))}
        </div>
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

// 되돌릴 수 없어 비밀번호와 확인 문구를 함께 받는다
export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, undefined);

  return (
    <form action={action} className={form.form}>
      <p className={styles.note}>
        대화·기억·내 프로필·엑스트라·캐릭터 초안이 모두 지워지고, 발행한 캐릭터는 내려갑니다. 결제 기록은 법에 따라 정해진 기간 보관됩니다.
        되돌릴 수 없어요.
      </p>
      <label className={form.field}>
        <span className={form.label}>비밀번호</span>
        <input className={form.input} name="password" type="password" autoComplete="current-password" required />
      </label>
      <label className={form.field}>
        <span className={form.label}>확인 문구</span>
        <input className={form.input} name="confirm" placeholder="탈퇴합니다" autoComplete="off" required />
        <span className={form.hint}>&quot;탈퇴합니다&quot;를 그대로 입력해 주세요.</span>
      </label>
      <Status state={state} />
      <button type="submit" className={styles.danger} disabled={pending}>
        {pending ? "지우는 중…" : "회원 탈퇴"}
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
