"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { readMind } from "@/app/actions/operations";
import ChatText from "@/components/chat-text";
import form from "@/components/form.module.css";
import { formatDay } from "@/lib/format-time";
import type { MindView } from "@/lib/operations";
import styles from "../ops.module.css";

const fmt = (n: number) => n.toLocaleString("ko-KR");

// 심리 탐구: 지금 장면에서 캐릭터가 겉으로 말하지 않은 속마음을 엿본다
export default function MindPanel({ data }: { data: MindView }) {
  const name = data.character.name;
  const [readings, setReadings] = useState(data.readings);
  const [balance, setBalance] = useState(data.balance);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const poor = balance < data.cost;

  const onRead = () =>
    startTransition(async () => {
      setError(null);
      const result = await readMind(data.character.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReadings((prev) => [result.data.reading, ...prev]);
      setBalance(result.data.balance);
    });

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>오퍼레이션 · 심리 탐구</span>
        <h1 className={styles.title}>{name}의 머릿속</h1>
        <p className={styles.lead}>
          지금 대화 장면을 바탕으로 {name}가 겉으로 말하지 않은 속마음을 엿봐요. 캐릭터 설정의 비밀은 드러나지 않고,
          대화에서 실제로 있었던 일과 지금의 감정만 보여 줘요.
        </p>
      </header>

      {!data.started ? (
        <p className={styles.notice}>
          아직 {name}와 나눈 대화가 없어요. <Link href={`/characters/${data.character.id}/chat`}>먼저 말을 걸어</Link> 보세요.
        </p>
      ) : (
        <div className={styles.action}>
          <span className={styles.actionText}>
            <span>
              지금 이 순간의 속마음 엿보기 · <strong>{fmt(data.cost)} 코레딧</strong>
            </span>
            <small>
              내 코레딧 <span className={styles.balance}>{fmt(balance)}</span>
              {poor && (
                <>
                  {" "}
                  · <Link href="/me">출석하고 코레딧 받기</Link>
                </>
              )}
            </small>
          </span>
          <button type="button" className={styles.primary} onClick={onRead} disabled={pending || poor}>
            {pending ? "엿보는 중…" : "속마음 엿보기"}
            <span className={styles.cost}>{fmt(data.cost)}</span>
          </button>
        </div>
      )}

      {error && (
        <p className={form.error} role="alert">
          {error}
        </p>
      )}

      {readings.length === 0 ? (
        data.started && <p className={styles.empty}>아직 엿본 속마음이 없어요.</p>
      ) : (
        <ol className={styles.list} aria-label="엿본 속마음">
          {readings.map((r) => (
            <li key={r.id} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.badge}>{r.feeling}</span>
                <time dateTime={r.createdAt}>{formatDay(r.createdAt)}</time>
              </div>
              <div className={styles.quote}>
                <ChatText text={r.innerVoice} userName="나" />
              </div>
              <p className={styles.aside}>
                <strong>나에 대해</strong> · {r.aboutUser}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
