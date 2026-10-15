"use client";

import { useEffect, useId, useRef, useState } from "react";
import { reportCharacter } from "@/app/actions/reports";
import { REPORT_REASONS } from "@/lib/reports";
import styles from "./page.module.css";

// 캐릭터 상세의 "신고". 사유를 고르고(기타는 내용 필수) 보내면 운영자 신고함에 쌓인다
export default function ReportButton({ characterId, characterName }: { characterId: string; characterName: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = await reportCharacter(characterId, reason, detail);
    setBusy(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  };

  const close = () => {
    if (busy) return;
    setOpen(false);
    if (done) {
      setDone(false);
      setReason("");
      setDetail("");
    }
  };

  return (
    <>
      <button type="button" className={styles.reportButton} onClick={() => setOpen(true)}>
        신고하기
      </button>
      <dialog
        ref={ref}
        className={styles.reportDialog}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className={styles.reportBody}>
          <p id={titleId} className={styles.reportTitle}>
            {done ? "신고했습니다" : `${characterName} 신고하기`}
          </p>
          {done ? (
            <>
              <p className={styles.reportText}>운영자가 확인해 처리합니다. 알려 주셔서 고맙습니다.</p>
              <div className={styles.reportActions}>
                <button type="button" className={styles.reportPrimary} onClick={close}>
                  확인
                </button>
              </div>
            </>
          ) : (
            <>
              <label className={styles.reportField}>
                <span>신고 사유</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy}>
                  <option value="">고르세요</option>
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.reportField}>
                <span>
                  자세한 내용 {reason === "OTHER" ? "(필수)" : "(선택)"} <em>{detail.length}/500</em>
                </span>
                <textarea rows={4} maxLength={500} value={detail} onChange={(e) => setDetail(e.target.value)} disabled={busy} />
              </label>
              {error && (
                <p className={styles.reportError} role="alert">
                  {error}
                </p>
              )}
              <div className={styles.reportActions}>
                <button type="button" className={styles.reportPlain} onClick={close} disabled={busy}>
                  취소
                </button>
                <button
                  type="button"
                  className={styles.reportPrimary}
                  onClick={() => void submit()}
                  disabled={busy || reason === "" || (reason === "OTHER" && detail.trim() === "")}
                >
                  {busy ? "보내는 중…" : "신고하기"}
                </button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
