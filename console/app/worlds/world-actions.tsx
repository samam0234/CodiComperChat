"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { decideWorldImage, decideWorldMap, restoreWorld, takeDownWorld } from "@/app/actions/admin";
import ChoiceDialog from "@/components/choice-dialog";
import styles from "./worlds.module.css";

type Run = () => Promise<{ ok: boolean; error?: string }>;

function useRun() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: Run) => {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "처리하지 못했습니다.");
      return false;
    }
    router.refresh();
    return true;
  };
  return { busy, error, run };
}

// 세계관 내리기(사유 필수, 만든 사람이 봄) / 복구
export function WorldTakedown({ id, title, takenDown }: { id: string; title: string; takenDown: boolean }) {
  const { busy, error, run } = useRun();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (takenDown) {
    return (
      <span className={styles.actions}>
        <button type="button" className={styles.plain} disabled={busy} onClick={() => void run(() => restoreWorld(id))}>
          복구
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </span>
    );
  }
  return (
    <span className={styles.actions}>
      <button type="button" className={styles.dangerButton} disabled={busy} onClick={() => setOpen(true)}>
        내리기
      </button>
      <ChoiceDialog
        open={open}
        title={`'${title}'을(를) 내릴까요?`}
        busy={busy}
        onClose={() => !busy && setOpen(false)}
        choices={[
          { label: "취소", onSelect: () => setOpen(false) },
          {
            label: "내리기",
            tone: "danger",
            onSelect: () =>
              void run(() => takeDownWorld(id, reason)).then((ok) => {
                if (ok) {
                  setOpen(false);
                  setReason("");
                }
              }),
          },
        ]}
      >
        <label className={styles.field}>
          <span>내리는 사유 (필수, 만든 사람이 편집기와 상세 화면에서 봅니다)</span>
          <textarea rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} />
        </label>
        {error && <p className={styles.error}>{error}</p>}
      </ChoiceDialog>
      {error && !open && <span className={styles.error}>{error}</span>}
    </span>
  );
}

// 장면 그림 결정: 통과 · 거절 · 막기 · 막기 풀기
export function ImageDecision({ imageId, review, blocked }: { imageId: string; review: string; blocked: boolean }) {
  const { busy, error, run } = useRun();
  return (
    <span className={styles.actions}>
      {review !== "APPROVED" && !blocked && (
        <button type="button" className={styles.button} disabled={busy} onClick={() => void run(() => decideWorldImage(imageId, "approve"))}>
          통과
        </button>
      )}
      {review === "PENDING" && !blocked && (
        <button type="button" className={styles.plain} disabled={busy} onClick={() => void run(() => decideWorldImage(imageId, "reject"))}>
          거절
        </button>
      )}
      {blocked ? (
        <button type="button" className={styles.plain} disabled={busy} onClick={() => void run(() => decideWorldImage(imageId, "unblock"))}>
          막기 풀기
        </button>
      ) : (
        <button type="button" className={styles.dangerButton} disabled={busy} onClick={() => void run(() => decideWorldImage(imageId, "block"))}>
          막기
        </button>
      )}
      {error && <span className={styles.error}>{error}</span>}
    </span>
  );
}

// 코퍼맵 지도 결정: 통과 · 거절 · 지우기
export function MapDecision({ id, review }: { id: string; review: string }) {
  const { busy, error, run } = useRun();
  return (
    <span className={styles.actions}>
      {review !== "APPROVED" && (
        <button type="button" className={styles.button} disabled={busy} onClick={() => void run(() => decideWorldMap(id, "approve"))}>
          통과
        </button>
      )}
      {review === "PENDING" && (
        <button type="button" className={styles.plain} disabled={busy} onClick={() => void run(() => decideWorldMap(id, "reject"))}>
          거절
        </button>
      )}
      <button type="button" className={styles.dangerButton} disabled={busy} onClick={() => void run(() => decideWorldMap(id, "remove"))}>
        지도 지우기
      </button>
      {error && <span className={styles.error}>{error}</span>}
    </span>
  );
}
