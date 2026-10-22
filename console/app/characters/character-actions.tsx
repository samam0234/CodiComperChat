"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { restoreCharacter, takeDownCharacter } from "@/app/actions/admin";
import ChoiceDialog from "@/components/choice-dialog";
import styles from "./characters.module.css";

// 캐릭터 한 줄의 처리 버튼: 내리기(사유 필수) / 복구
export default function CharacterActions({ id, name, takenDown, published }: { id: string; name: string; takenDown: boolean; published: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<{ ok: boolean; error?: string }>) => {
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

  if (takenDown) {
    return (
      <>
        <button type="button" className={styles.plain} disabled={busy} onClick={() => void run(() => restoreCharacter(id))}>
          복구
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </>
    );
  }
  if (!published) return <span className={styles.muted}>—</span>;

  return (
    <>
      <button type="button" className={styles.dangerButton} disabled={busy} onClick={() => setOpen(true)}>
        내리기
      </button>
      <ChoiceDialog
        open={open}
        title={`'${name}'을(를) 내릴까요?`}
        busy={busy}
        onClose={() => !busy && setOpen(false)}
        choices={[
          { label: "취소", onSelect: () => setOpen(false) },
          {
            label: "내리기",
            tone: "danger",
            onSelect: () =>
              void run(() => takeDownCharacter(id, note)).then((ok) => {
                if (ok) {
                  setOpen(false);
                  setNote("");
                }
              }),
          },
        ]}
      >
        <label className={styles.noteField}>
          <span>내리는 사유 (필수, 만든 사람이 공방에서 봅니다)</span>
          <textarea rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} disabled={busy} />
        </label>
        {error && (
          <span className={styles.error} role="alert">
            {error}
          </span>
        )}
      </ChoiceDialog>
    </>
  );
}
