"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { writeDiary } from "@/app/actions/operations";
import ChatText from "@/components/chat-text";
import form from "@/components/form.module.css";
import { formatDay } from "@/lib/format-time";
import type { DiaryView } from "@/lib/operations";
import styles from "../ops.module.css";

const fmt = (n: number) => n.toLocaleString("ko-KR");

// 일기: 캐릭터가 자기 입장에서 최근 대화에서 겪은 일과 기분을 적는다 (나는 몰래 읽는 쪽)
export default function DiaryPanel({ data }: { data: DiaryView }) {
  const name = data.character.name;
  const [entries, setEntries] = useState(data.entries);
  const [balance, setBalance] = useState(data.balance);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const poor = balance < data.cost;

  const onWrite = () =>
    startTransition(async () => {
      setError(null);
      const result = await writeDiary(data.character.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEntries((prev) => [result.data.entry, ...prev]);
      setBalance(result.data.balance);
    });

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>오퍼레이션 · 일기</span>
        <h1 className={styles.title}>{name}의 일기장</h1>
        <p className={styles.lead}>
          {name}가 자기 입장에서 쓰는 일기예요. 최근 대화에서 실제로 있었던 일을 돌아보며 그때의 기분을 그대로
          적어요. 대화에 없던 일은 지어내지 않아요.
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
              오늘 일기 한 편 받기 · <strong>{fmt(data.cost)} 코레딧</strong>
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
          <button type="button" className={styles.primary} onClick={onWrite} disabled={pending || poor}>
            {pending ? "쓰는 중…" : "일기 쓰게 하기"}
            <span className={styles.cost}>{fmt(data.cost)}</span>
          </button>
        </div>
      )}

      {error && (
        <p className={form.error} role="alert">
          {error}
        </p>
      )}

      {entries.length === 0 ? (
        data.started && <p className={styles.empty}>아직 쓴 일기가 없어요.</p>
      ) : (
        <ol className={styles.list} aria-label="일기">
          {entries.map((e) => (
            <li key={e.id}>
              <article className={styles.diary}>
                <div className={styles.cardHead}>
                  <span className={styles.badge}>{e.mood}</span>
                  <time dateTime={e.createdAt}>{formatDay(e.createdAt)}</time>
                </div>
                <h2 className={styles.diaryTitle}>{e.title}</h2>
                <div className={styles.diaryBody}>
                  <ChatText text={e.body} userName="나" />
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
