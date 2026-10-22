"use client";

import { useActionState } from "react";
import { resendVerification } from "@/app/actions/auth";
import form from "@/components/form.module.css";
import styles from "./page.module.css";

// 미인증 계정에만 보인다. 인증 메일을 다시 보낼 수 있다
export default function VerifyEmailNotice() {
  const [state, action, pending] = useActionState(resendVerification, undefined);

  return (
    <section className={styles.notice} aria-label="이메일 인증">
      <p>
        이메일 인증을 아직 하지 않았어요. 가입할 때 보낸 메일의 링크를 열면 끝나요. 인증해야 공방에서 캐릭터를
        발행할 수 있어요.
      </p>
      <form action={action}>
        <button type="submit" className={form.secondary} disabled={pending}>
          {pending ? "보내는 중…" : "인증 메일 다시 받기"}
        </button>
      </form>
      {state?.error && (
        <p className={form.error} role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className={form.success} role="status">
          {state.success}
        </p>
      )}
    </section>
  );
}
