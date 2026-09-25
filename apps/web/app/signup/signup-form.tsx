"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import styles from "@/components/form.module.css";

export default function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signup, undefined);

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
          <span className={styles.label}>표시 이름</span>
          <input
            className={styles.input}
            name="displayName"
            autoComplete="nickname"
            defaultValue={state?.values?.displayName}
            maxLength={20}
            required
          />
          <span className={styles.hint}>캐릭터가 아니라 다른 사람에게 보이는 이름입니다. 20자까지.</span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>비밀번호</span>
          <input
            className={styles.input}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
          <span className={styles.hint}>8자 이상</span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>비밀번호 확인</span>
          <input
            className={styles.input}
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </label>

        {state?.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? "가입 중…" : "회원가입"}
        </button>
      </form>

      <p className={styles.switch}>
        이미 계정이 있나요?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`}>로그인</Link>
      </p>
    </>
  );
}
