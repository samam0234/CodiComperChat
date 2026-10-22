"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import styles from "@/components/form.module.css";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <>
      <form action={action} className={styles.form}>
        <input type="hidden" name="next" value={next} />

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

        <label className={styles.field}>
          <span className={styles.label}>비밀번호</span>
          <input
            className={styles.input}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        <Link href="/forgot-password" className={styles.forgot}>
          비밀번호를 잊었나요?
        </Link>

        {state?.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? "로그인 중…" : "로그인"}
        </button>
      </form>

      <p className={styles.switch}>
        아직 계정이 없나요?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`}>회원가입</Link>
      </p>
    </>
  );
}
