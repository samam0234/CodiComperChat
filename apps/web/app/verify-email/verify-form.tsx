"use client";

import Link from "next/link";
import { useActionState } from "react";
import { verifyEmail } from "@/app/actions/auth";
import styles from "@/components/form.module.css";

export default function VerifyForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyEmail, undefined);

  if (state?.success) {
    return (
      <>
        <p className={styles.success} role="status">
          {state.success}
        </p>
        <p className={styles.switch}>
          <Link href="/me">마이페이지로</Link> · <Link href="/studio">공방으로</Link>
        </p>
      </>
    );
  }

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "확인 중…" : "이메일 인증 완료하기"}
      </button>
    </form>
  );
}
