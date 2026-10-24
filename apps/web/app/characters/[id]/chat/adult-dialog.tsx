"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef } from "react";
import { confirmAdult } from "@/app/actions/auth";
import form from "@/components/form.module.css";
import styles from "./photonet.module.css";

// 성인 확인 열림 상자 (코디포토넷에서 잠긴 성인 버튼을 누르면 설정 페이지로 가지 않고 여기서 바로 한다).
// 임시: 생년월일 + 동의 — 공개 전에는 본인인증으로 바꾼다. reason은 Nest가 알려 주는 막힌 이유
export default function AdultDialog({
  open,
  reason,
  message,
  onClose,
  onConfirmed,
}: {
  open: boolean;
  reason: string | null;
  message: string | null;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${styles.small}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.body}>
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            <span className={styles.badge} aria-hidden="true">19</span> 성인 확인
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="성인 확인 닫기">
            ✕
          </button>
        </div>
        {/* 열려 있을 때만 그려 다시 열면 입력이 비워진다 */}
        {open && <Body reason={reason} message={message} onClose={onClose} onConfirmed={onConfirmed} />}
      </div>
    </dialog>
  );
}

function Body({
  reason,
  message,
  onClose,
  onConfirmed,
}: {
  reason: string | null;
  message: string | null;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const [state, action, pending] = useActionState(confirmAdult, undefined);
  const done = useRef(false);

  useEffect(() => {
    if (state?.success && !done.current) {
      done.current = true;
      onConfirmed();
    }
  }, [state, onConfirmed]);

  if (reason === "EMAIL_UNVERIFIED") {
    return (
      <>
        <p className={styles.lead}>{message}</p>
        <div className={styles.footer}>
          <Link href="/me" className={styles.make}>
            마이페이지에서 메일 받기
          </Link>
        </div>
      </>
    );
  }
  if (reason === "UNDERAGE") {
    return (
      <>
        <p className={styles.lead}>{message}</p>
        <div className={styles.footer}>
          <button type="button" className={styles.make} onClick={onClose}>
            확인
          </button>
        </div>
      </>
    );
  }

  return (
    <form action={action} className={styles.form}>
      <p className={styles.lead}>
        성인 모드는 성인끼리의 성적 장면·폭력 묘사가 담긴 그림을 만듭니다. 만 19세 이상만 쓸 수 있어요.
      </p>
      {reason === "NO_BIRTHDATE" && (
        <label className={form.field}>
          <span className={form.label}>생년월일</span>
          <input
            className={form.input}
            name="birthDate"
            type="date"
            min="1900-01-01"
            defaultValue={state?.values?.birthDate}
            required
          />
          <span className={form.hint}>한 번 저장하면 바꿀 수 없어요.</span>
        </label>
      )}
      <label className={styles.consent}>
        <input type="checkbox" name="consent" required />
        <span>나는 만 19세 이상이며, 성인끼리의 성적 장면과 폭력 묘사가 담긴 그림을 만드는 데 동의합니다.</span>
      </label>
      {state?.error && (
        <p className={form.error} role="alert">
          {state.error}
        </p>
      )}
      <div className={styles.footer}>
        <button type="button" className={styles.fill} onClick={onClose} disabled={pending}>
          취소
        </button>
        <button type="submit" className={styles.make} disabled={pending}>
          {pending ? "확인하는 중…" : "성인 확인"}
        </button>
      </div>
    </form>
  );
}
