"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword } from "@/app/actions/auth";
import styles from "@/components/form.module.css";

export default function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPassword, undefined);

  return (
    <>
      <form action={action} className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
          <input
            className={styles.input}
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state?.values?.email}
            required
          />
        </label>

        {state?.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className={styles.success} role="status">
            {state.success}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? "보내는 중…" : "재설정 링크 받기"}
        </button>
      </form>

      <p className={styles.switch}>
        비밀번호가 생각났나요? <Link href="/login">로그인</Link>
      </p>
    </>
  );
}
