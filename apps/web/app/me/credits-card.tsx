"use client";

import { useState, useTransition } from "react";
import { attend } from "@/app/actions/credits";
import type { CreditSummary } from "@/lib/credits";
import { formatDay } from "@/lib/format-time";
import styles from "./credits.module.css";

const REASON: Record<CreditSummary["history"][number]["reason"], string> = {
  ATTENDANCE: "출석",
  MODEL_USE: "모델 사용",
  REFUND: "돌려받음",
  ADMIN: "운영자 조정",
};

const HISTORY_SHOWN = 5;

const fmt = (n: number) => n.toLocaleString("ko-KR");

// 마이페이지의 코레딧: 잔액, 하루 한 번 출석, 최근 기록
export default function CreditsCard({ summary }: { summary: CreditSummary }) {
  const [balance, setBalance] = useState(summary.balance);
  const [attended, setAttended] = useState(summary.attendedToday);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const onAttend = () =>
    startTransition(async () => {
      const result = await attend();
      if (result.ok) {
        setBalance(result.balance);
        setAttended(true);
        setMessage({ ok: true, text: `출석 완료! ${fmt(result.credited)} 코레딧을 받았어요.` });
      } else {
        setMessage({ ok: false, text: result.error });
        if (result.error.includes("이미 출석")) setAttended(true);
      }
    });

  return (
    <section className={styles.card} aria-labelledby="credits-title">
      <div className={styles.head}>
        <h2 id="credits-title" className={styles.title}>
          코레딧
        </h2>
        <p className={styles.balance}>
          <strong>{fmt(balance)}</strong> 코레딧
        </p>
      </div>
      <p className={styles.note}>
        프리미엄 모델(Claude·Grok)로 답을 받을 때 씁니다. 100 코레딧 = {fmt(summary.krwPer100)}원 · 판매는 준비 중이에요.
      </p>
      <div className={styles.attendRow}>
        <button type="button" className={styles.attend} onClick={onAttend} disabled={attended || pending}>
          {attended ? "오늘 출석 완료" : `출석하고 ${fmt(summary.attendanceReward)} 코레딧 받기`}
        </button>
        <span className={styles.hint}>하루 한 번 · 무료 1,000 · 프로 5,000 · 한국 시각 자정에 다시</span>
      </div>
      {message && (
        <p className={message.ok ? styles.ok : styles.error} role={message.ok ? "status" : "alert"}>
          {message.text}
        </p>
      )}
      {summary.history.length > 0 && (
        <ul className={styles.history} aria-label="최근 코레딧 기록">
          {summary.history.slice(0, HISTORY_SHOWN).map((e, i) => (
            <li key={`${e.createdAt}-${i}`}>
              {formatDay(e.createdAt)} · {REASON[e.reason]}
              {e.modelId ? ` (${e.modelId})` : ""} · {e.delta > 0 ? "+" : ""}
              {fmt(e.delta)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
