"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { sendDirectMessage } from "@/app/actions/operations";
import { formatTime } from "@/lib/format-time";
import type { DirectMessage, MessagesView } from "@/lib/operations";
import ops from "../ops.module.css";
import styles from "./messenger.module.css";

const MAX = 500;


// 메시지: 대화(롤플레이)와 따로 휴대폰 문자처럼 주고받는다. 기억·관계는 대화와 함께 쓴다
export default function Messenger({ data }: { data: MessagesView }) {
  const name = data.character.name;
  const [messages, setMessages] = useState<(DirectMessage & { pending?: boolean })[]>(data.messages);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startTransition] = useTransition();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages.length, sending]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (trimmed === "" || sending) return;
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: "user", text: trimmed, createdAt: new Date().toISOString(), pending: true }]);
    setText("");
    setError(null);
    startTransition(async () => {
      const result = await sendDirectMessage(data.character.id, trimmed);
      if (!result.ok) {
        // 보내지 못한 문자는 지우고 입력칸에 되돌려 다시 보낼 수 있게
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setText(trimmed);
        setError(result.error);
        return;
      }
      setMessages((prev) => [...prev.filter((m) => m.id !== tempId), result.data.sent, result.data.reply]);
    });
  };

  return (
    <div className={ops.page}>
      <header className={ops.head}>
        <span className={ops.eyebrow}>오퍼레이션 · 메시지</span>
        <h1 className={ops.title}>{name}에게 문자 보내기</h1>
        <p className={ops.lead}>
          장면 속 대화와 따로 주고받는 짧은 문자예요. {name}는 지금까지의 기억과 관계를 그대로 알고 답해요. 코레딧은 들지
          않아요.
        </p>
      </header>

      {!data.started ? (
        <p className={ops.notice}>
          아직 {name}와 나눈 대화가 없어요. <Link href={`/characters/${data.character.id}/chat`}>먼저 말을 걸어</Link> 보세요.
        </p>
      ) : (
        <div className={styles.phone}>
          <div className={styles.top}>
            <span className={styles.avatar} aria-hidden="true">
              {Array.from(name.trim())[0] ?? "?"}
            </span>
            <span className={styles.peer}>
              <strong>{name}</strong>
              <small>메시지</small>
            </span>
          </div>
          <div className={styles.log} role="log" aria-label={`${name}와 주고받은 문자`} aria-live="polite" ref={logRef}>
            {messages.length === 0 && <p className={styles.hint}>첫 문자를 보내 보세요.</p>}
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? styles.mine : styles.theirs}>
                <p className={styles.bubble}>{m.text}</p>
                <span className={styles.time}>{m.pending ? "보내는 중" : formatTime(m.createdAt)}</span>
              </div>
            ))}
            {sending && (
              <div className={styles.theirs} role="status">
                <p className={`${styles.bubble} ${styles.typing}`}>
                  <span />
                  <span />
                  <span />
                  <span className={styles.srOnly}>{name}가 입력 중</span>
                </p>
              </div>
            )}
          </div>
          <form className={styles.compose} onSubmit={onSubmit}>
            <input
              className={styles.input}
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={MAX}
              placeholder="문자 보내기"
              aria-label="보낼 문자"
              disabled={sending}
            />
            <button type="submit" className={styles.send} disabled={sending || text.trim() === ""}>
              보내기
            </button>
          </form>
        </div>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
