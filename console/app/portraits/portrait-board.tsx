"use client";

import { useState, useTransition } from "react";
import { decidePortrait } from "@/app/actions/admin";
import type { PendingPortrait } from "@/lib/types";
import { formatDayTime } from "@/lib/format-time";
import styles from "./portrait-board.module.css";

export default function PortraitBoard({ pending }: { pending: PendingPortrait[] }) {
  const [items, setItems] = useState(pending);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const decide = (draftId: string, decision: "approve" | "reject") =>
    startTransition(async () => {
      setError(null);
      const result = await decidePortrait(draftId, decision, notes[draftId] ?? "");
      if (result.ok) setItems((list) => list.filter((item) => item.draftId !== draftId));
      else setError(result.error);
    });

  if (items.length === 0) return <p className={styles.empty}>검수를 기다리는 초상이 없습니다.</p>;

  return (
    <>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.draftId} className={styles.item} aria-label={`${item.name} 초상`}>
            {/* 운영자 전용 중계. 검수 대상이라 캐시하지 않는다 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/portraits/${encodeURIComponent(item.draftId)}`} alt={`${item.name} 초상`} width={120} height={120} />
            <div className={styles.body}>
              <p className={styles.name}>
                {item.name} {item.published && <span className={styles.tag}>발행됨</span>}
              </p>
              <p className={styles.meta}>
                {item.owner} ({item.ownerEmail}) · {formatDayTime(item.updatedAt)}
              </p>
              <p className={styles.note}>{item.note}</p>
              <input
                className={styles.input}
                placeholder="반려 사유 (만든 사람에게 보입니다)"
                value={notes[item.draftId] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [item.draftId]: e.target.value }))}
                aria-label={`${item.name} 반려 사유`}
              />
              <div className={styles.actions}>
                <button type="button" className={styles.approve} disabled={busy} onClick={() => decide(item.draftId, "approve")}>
                  승인
                </button>
                <button type="button" className={styles.reject} disabled={busy} onClick={() => decide(item.draftId, "reject")}>
                  반려
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
