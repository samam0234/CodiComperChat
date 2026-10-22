"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import styles from "@/components/form.module.css";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="next" value={next} />
      <label className={styles.field}>
        <span className={styles.label}>이메일</span>
        <input className={styles.input} name="email" type="email" autoComplete="username" defaultValue={state?.email} required />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>비밀번호</span>
        <input className={styles.input} name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
