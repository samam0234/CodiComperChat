"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { replyInquiry } from "@/app/actions/admin";
import styles from "./inquiries.module.css";

export default function ReplyBox({ id }: { id: string }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={styles.reply}
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await replyInquiry(id, reply);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setReply("");
          setError(null);
          router.refresh();
        });
      }}
    >
      <textarea value={reply} maxLength={2000} rows={3} required placeholder="이용자에게 보일 답" onChange={(event) => setReply(event.target.value)} />
      <button type="submit" disabled={pending}>
        {pending ? "저장 중…" : "답변 저장"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
