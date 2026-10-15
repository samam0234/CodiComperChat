"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import styles from "@/components/form.module.css";

export default function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="token" value={token} />

      <label className={styles.field}>
        <span className={styles.label}>새 비밀번호</span>
        <input
          className={styles.input}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />
        <span className={styles.hint}>8자 이상. 너무 흔한 비밀번호는 쓸 수 없어요.</span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>새 비밀번호 확인</span>
        <input
          className={styles.input}
          name="newPasswordConfirm"
          type="password"
          autoComplete="new-password"
          required
        />
      </label>

      {state?.error && (
        <p className={styles.error} role="alert">
          {state.error} {state.error.includes("링크") && <Link href="/forgot-password">비밀번호 찾기</Link>}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "바꾸는 중…" : "비밀번호 바꾸기"}
      </button>
    </form>
  );
}
