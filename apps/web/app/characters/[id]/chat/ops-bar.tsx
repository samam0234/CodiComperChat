"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./ops-bar.module.css";

// 오퍼레이션: 대화에 붙는 플러그인. 각자 /characters/:id/chat/<slug> 화면을 가진다
export const OPERATIONS = [
  { slug: "mind", label: "심리 탐구", hint: "상대의 머릿속 엿보기", icon: "◎" },
  { slug: "diary", label: "일기", hint: "캐릭터가 쓴 오늘 하루", icon: "✎" },
  { slug: "messages", label: "메시지", hint: "문자로 주고받기", icon: "✉" },
] as const;

// 입력창 바로 위 줄: 왼쪽에 (코디포토넷 등) 도구 버튼, 그 옆에 오퍼레이션 메뉴
export default function OpsBar({ characterId, children }: { characterId: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const items = () => Array.from(rootRef.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]') ?? []);

  useEffect(() => {
    if (!open) return;
    items()[0]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      list[(index + 1) % list.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      list[(index - 1 + list.length) % list.length]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={styles.bar}>
      {children}
      <div className={styles.menuRoot} ref={rootRef}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.opsButton}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">✦</span> 오퍼레이션
        </button>
        {open && (
          <ul id={menuId} className={styles.menu} role="menu" aria-label="오퍼레이션" onKeyDown={onMenuKeyDown}>
            {OPERATIONS.map((op) => (
              <li key={op.slug} role="none">
                <Link
                  role="menuitem"
                  href={`/characters/${characterId}/chat/${op.slug}`}
                  className={styles.item}
                  onClick={() => setOpen(false)}
                >
                  <span className={styles.icon} aria-hidden="true">
                    {op.icon}
                  </span>
                  <span className={styles.itemText}>
                    <strong>{op.label}</strong>
                    <small>{op.hint}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
