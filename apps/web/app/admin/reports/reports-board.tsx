"use client";

import Link from "next/link";
import { useState } from "react";
import { dismissReports, restoreCharacter, takeDownCharacter } from "@/app/actions/reports";
import ChoiceDialog from "@/components/choice-dialog";
import { formatDayTime as formatWhen } from "@/lib/format-time";
import { reasonLabel, type OpenGroup, type TakenDown } from "@/lib/reports";
import styles from "./reports-board.module.css";

const VISIBILITY_LABEL = { PUBLIC: "공개", UNLISTED: "링크 공개", PRIVATE: "비공개" } as const;


type Pending = { kind: "takedown" | "dismiss"; group: OpenGroup };

export default function ReportsBoard({ open, takenDown }: { open: OpenGroup[]; takenDown: TakenDown[] }) {
  const [groups, setGroups] = useState(open);
  const [down, setDown] = useState(takenDown);
  const [pending, setPending] = useState<Pending | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (busy) return;
    setPending(null);
    setNote("");
    setError(null);
  };

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    const { kind, group } = pending;
    const result =
      kind === "takedown"
        ? await takeDownCharacter(group.character.id, note)
        : await dismissReports(group.character.id, note);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setGroups((prev) => prev.filter((g) => g.character.id !== group.character.id));
    if (kind === "takedown") {
      setDown((prev) => [
        {
          id: group.character.id,
          name: group.character.name,
          takenDownAt: new Date().toISOString(),
          takedownReason: note.trim(),
          owner: group.character.owner ? { displayName: group.character.owner.displayName } : null,
        },
        ...prev,
      ]);
    }
    setPending(null);
    setNote("");
  };

  const restore = async (item: TakenDown) => {
    setBusy(true);
    setError(null);
    const result = await restoreCharacter(item.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDown((prev) => prev.filter((d) => d.id !== item.id));
  };

  return (
    <>
      {error && !pending && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <h2 className={styles.sectionTitle}>
        처리 대기 <span className={styles.count}>{groups.length}</span>
      </h2>
      {groups.length === 0 ? (
        <div className={styles.empty}>처리할 신고가 없습니다.</div>
      ) : (
        <ul className={styles.list}>
          {groups.map((g) => (
            <li key={g.character.id} className={styles.card}>
              <div className={styles.head}>
                <Link href={`/characters/${g.character.id}`} className={styles.name}>
                  {g.character.name}
                </Link>
                <span className={styles.badge}>신고 {g.reports.length}건</span>
                <span className={styles.meta}>{VISIBILITY_LABEL[g.character.visibility]}</span>
              </div>
              <p className={styles.oneLiner}>{g.character.oneLiner}</p>
              <p className={styles.meta}>
                만든 사람: {g.character.owner ? `${g.character.owner.displayName} (${g.character.owner.email})` : "운영 캐릭터"}
              </p>
              <ul className={styles.reports}>
                {g.reports.map((r) => (
                  <li key={r.id}>
                    <strong>{reasonLabel(r.reason)}</strong>
                    {r.detail && <span> — {r.detail}</span>}
                    <span className={styles.meta}>
                      {" "}
                      · {r.reporter.displayName} · {formatWhen(r.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                <button type="button" className={styles.plain} onClick={() => setPending({ kind: "dismiss", group: g })} disabled={busy}>
                  신고 기각
                </button>
                <button type="button" className={styles.danger} onClick={() => setPending({ kind: "takedown", group: g })} disabled={busy}>
                  캐릭터 내리기
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className={styles.sectionTitle}>
        내려간 캐릭터 <span className={styles.count}>{down.length}</span>
      </h2>
      {down.length === 0 ? (
        <div className={styles.empty}>내려간 캐릭터가 없습니다.</div>
      ) : (
        <ul className={styles.list}>
          {down.map((d) => (
            <li key={d.id} className={styles.card}>
              <div className={styles.head}>
                <span className={styles.name}>{d.name}</span>
                <span className={styles.meta}>
                  {formatWhen(d.takenDownAt)} · {d.owner?.displayName ?? "운영 캐릭터"}
                </span>
              </div>
              {d.takedownReason && <p className={styles.oneLiner}>사유: {d.takedownReason}</p>}
              <div className={styles.actions}>
                <button type="button" className={styles.plain} onClick={() => void restore(d)} disabled={busy}>
                  복구하기
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ChoiceDialog
        open={pending !== null}
        title={pending?.kind === "takedown" ? `'${pending.group.character.name}'을(를) 내릴까요?` : "신고를 기각할까요?"}
        onClose={close}
        busy={busy}
        choices={[
          { label: "취소", onSelect: close },
          {
            label: pending?.kind === "takedown" ? "내리기" : "기각",
            tone: pending?.kind === "takedown" ? "danger" : "primary",
            onSelect: () => void confirm(),
          },
        ]}
      >
        <label className={styles.noteField}>
          <span>{pending?.kind === "takedown" ? "내리는 사유 (필수, 만든 사람에게 보입니다)" : "기각 메모 (선택)"}</span>
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
