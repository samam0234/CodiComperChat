"use client";

import { useEffect, useId, useRef, useState } from "react";
import { reportContent } from "@/app/actions/reports";
import { CONTENT_REPORT_REASONS } from "@/lib/content-reports";
import styles from "./content-report.module.css";

// 내가 만든 코디포토넷 그림·웹툰을 운영자에게 보낸다. 운영자는 그림을 보고 접근을 막거나 계정을 정지할 수 있다
export default function ContentReport({
  characterId,
  target,
  targetId,
  returnTo,
}: {
  characterId: string;
  target: "PHOTONET" | "WEBTOON";
  targetId: string;
  returnTo: string;
}) {
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

  const close = () => {
    if (busy) return;
    setOpen(false);
    if (done) {
      setDone(false);
      setReason("");
      setDetail("");
      setError(null);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = await reportContent(characterId, target, targetId, reason, detail, returnTo);
    setBusy(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  };

  return (
    <>
      <button type="button" className={styles.button} onClick={() => setOpen(true)}>
        신고
      </button>
      <dialog ref={ref} className={styles.dialog} aria-labelledby={titleId} onClose={close}>
        <div className={styles.body}>
          <p id={titleId} className={styles.title}>
            이 그림을 신고
          </p>
          {done ? (
            <p className={styles.text}>운영자가 그림을 확인해 처리합니다. 알려 주셔서 고맙습니다.</p>
          ) : (
            <>
              <p className={styles.text}>미성년자로 보이거나 실사와 너무 비슷하면 알려 주세요. 운영자가 그림을 봅니다.</p>
              <label className={styles.field}>
                사유
                <select value={reason} onChange={(event) => setReason(event.target.value)}>
                  <option value="">골라 주세요</option>
                  {CONTENT_REPORT_REASONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                자세한 내용 (기타는 필수)
                <textarea value={detail} maxLength={500} onChange={(event) => setDetail(event.target.value)} />
              </label>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
            </>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.plain} onClick={close} disabled={busy}>
              닫기
            </button>
            {!done && (
              <button type="button" className={styles.primary} onClick={submit} disabled={busy || reason === ""}>
                {busy ? "보내는 중…" : "신고하기"}
              </button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
