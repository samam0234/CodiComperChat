"use client";

import { useActionState } from "react";
import { createWorld } from "./actions";
import styles from "./page.module.css";

export default function CreateWorldButton() {
  const [state, action, pending] = useActionState(createWorld, undefined);
  return (
    <form action={action} className={styles.createForm}>
      <button type="submit" className={styles.create} disabled={pending}>
        {pending ? "만드는 중…" : "+ 새 세계관 만들기"}
      </button>
      {state?.error && <p className={styles.notice}>{state.error}</p>}
    </form>
  );
}
