"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./character-chat.module.css";

// 대화 상자 오른쪽 위 "⋮" — 이 캐릭터와의 대화에만 해당하는 전용 설정으로 가는 메뉴
export default function ChatMenu({ characterId }: { characterId: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const items = [
    { href: "/library", label: "대화 목록" },
    { href: `/characters/${characterId}/chat/saved`, label: "저장한 대화 (이어하기)" },
    { href: `/characters/${characterId}/chat/memories`, label: "메모리 기록 확인" },
    { href: `/characters/${characterId}/chat/settings`, label: "캐릭터 내 상태설정" },
  ];

  const menuItems = () =>
    Array.from(rootRef.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]') ?? []);

  // 열리면 첫 항목에 초점, 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    menuItems()[0]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const close = (focusButton: boolean) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const list = menuItems();
    const index = list.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      list[(index + 1) % list.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      list[(index - 1 + list.length) % list.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      list[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      list[list.length - 1]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={styles.menuRoot} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.menuButton}
        aria-label="대화 설정"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" fill="currentColor" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          <circle cx="12" cy="19" r="1.8" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <ul id={menuId} className={styles.menu} role="menu" aria-label="대화 설정" onKeyDown={onMenuKeyDown}>
          {items.map((item) => (
            <li key={item.href} role="none">
              <Link href={item.href} role="menuitem" className={styles.menuItem} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
