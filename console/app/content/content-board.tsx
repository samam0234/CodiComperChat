"use client";

import { useState, useTransition } from "react";
import { blockContent, dismissContent, unsuspendUser } from "@/app/actions/admin";
import { formatDayTime } from "@/lib/format-time";
import { targetLabel, type ContentReportItem } from "@/lib/content-reports";
import styles from "./content-board.module.css";

function reasonLabel(reasons: { value: string; label: string }[], value: string) {
  return reasons.find((item) => item.value === value)?.label ?? value;
}

function Pictures({ item }: { item: ContentReportItem }) {
  if (item.missing) return <p className={styles.meta}>그림이 이미 지워졌습니다.</p>;
  if (item.target === "PHOTONET") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/api/content-reports/${encodeURIComponent(item.id)}`} alt="" width={160} height={160} />
    );
  }
  if (item.panels.length === 0) return <p className={styles.meta}>그린 컷이 없습니다.</p>;
  return (
    <div className={styles.panels}>
      {item.panels.map((index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          src={`/api/content-reports/${encodeURIComponent(item.id)}?panel=${index}`}
          alt={`${index + 1}컷`}
          width={120}
          height={160}
        />
      ))}
    </div>
  );
}

export default function ContentBoard({
  open,
  blocked,
  reasons,
}: {
  open: ContentReportItem[];
  blocked: ContentReportItem[];
  reasons: { value: string; label: string }[];
}) {
  const [items, setItems] = useState(open);
  const [done, setDone] = useState(blocked);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const run = (id: string, action: "block" | "suspend" | "dismiss") =>
    startTransition(async () => {
      setError(null);
      const note = notes[id] ?? "";
      const result =
        action === "dismiss" ? await dismissContent(id, note) : await blockContent(id, note, action === "suspend");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const item = items.find((row) => row.id === id);
      setItems((list) => list.filter((row) => row.id !== id));
      if (item && action !== "dismiss") {
        setDone((list) => [{ ...item, resolution: note, ownerSuspended: action === "suspend" || item.ownerSuspended }, ...list]);
      }
    });

  const restore = (userId: string) =>
    startTransition(async () => {
      setError(null);
      const result = await unsuspendUser(userId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone((list) => list.map((item) => (item.owner?.id === userId ? { ...item, ownerSuspended: false } : item)));
    });

  return (
    <>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <h2 className={styles.heading}>확인 대기</h2>
      {items.length === 0 ? (
        <p className={styles.empty}>확인할 그림 신고가 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <Pictures item={item} />
              <div className={styles.body}>
                <p className={styles.name}>
                  {targetLabel(item.target)}
                  {item.rating === "nsfw" && <span className={styles.tag}>19</span>}
                </p>
                <p className={styles.meta}>
                  {item.characterName || "알 수 없는 캐릭터"} · {item.owner ? `${item.owner.displayName} (${item.owner.email})` : "주인 없음"} ·{" "}
                  {item.createdAt ? formatDayTime(item.createdAt) : ""}
                </p>
                <p className={styles.note}>
                  {reasonLabel(reasons, item.reason)}
                  {item.detail ? ` — ${item.detail}` : ""} · 신고 {item.reporter.displayName}
                </p>
                <p className={styles.note}>{item.label}</p>
                <input
                  className={styles.input}
                  placeholder="처리 사유 (접근을 막으면 만든 사람에게 보입니다)"
                  value={notes[item.id] ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                  aria-label="처리 사유"
                />
                <div className={styles.actions}>
                  <button type="button" className={styles.reject} disabled={busy} onClick={() => run(item.id, "block")}>
                    접근 차단
                  </button>
                  <button type="button" className={styles.reject} disabled={busy || !item.owner} onClick={() => run(item.id, "suspend")}>
                    차단하고 계정 정지
                  </button>
                  <button type="button" className={styles.approve} disabled={busy} onClick={() => run(item.id, "dismiss")}>
                    문제없음
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className={styles.heading}>접근을 막은 그림</h2>
      {done.length === 0 ? (
        <p className={styles.empty}>막은 그림이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {done.map((item) => (
            <li key={item.id} className={styles.item}>
              <Pictures item={item} />
              <div className={styles.body}>
                <p className={styles.name}>
                  {targetLabel(item.target)} <span className={styles.tag}>차단</span>
                </p>
                <p className={styles.meta}>
                  {item.owner ? `${item.owner.displayName} (${item.owner.email})` : "주인 없음"}
                  {item.ownerSuspended ? " · 계정 정지" : ""}
                </p>
                <p className={styles.note}>{item.resolution}</p>
                {item.ownerSuspended && item.owner && (
                  <div className={styles.actions}>
                    <button type="button" className={styles.approve} disabled={busy} onClick={() => restore(item.owner!.id)}>
                      계정 정지 해제
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
