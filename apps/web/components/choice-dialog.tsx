"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./choice-dialog.module.css";

export type DialogChoice = {
  label: string;
  onSelect: () => void;
  tone?: "primary" | "plain" | "danger";
};

// 확인·선택 상자. 브라우저 기본 <dialog>를 써서 포커스 가두기와 Esc 닫기를 그대로 얻는다
export default function ChoiceDialog({
  open,
  title,
  children,
  choices,
  onClose,
  busy,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  choices: DialogChoice[];
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="choice-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        // 상자 바깥(배경)을 누르면 닫는다
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className={styles.body}>
        <p id="choice-dialog-title" className={styles.title}>
          {title}
        </p>
        {children && <div className={styles.text}>{children}</div>}
        <div className={styles.actions}>
          {choices.map((choice) => (
            <button
              key={choice.label}
              type="button"
              className={styles[choice.tone ?? "plain"]}
              onClick={choice.onSelect}
              disabled={busy}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </dialog>
  );
}
