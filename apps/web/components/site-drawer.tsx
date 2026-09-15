"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import styles from "./site-drawer.module.css";

const DRAWER_NAV = [
  { href: "/", label: "홈" },
  { href: "/library", label: "대화 목록 (라이브러리)" },
  { href: "/studio", label: "제작" },
  { href: "/me", label: "마이페이지" },
  { href: "/settings", label: "설정" },
];

type SiteDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function SiteDrawer({ open, onClose }: SiteDrawerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div className={styles.root} data-open={open || undefined} inert={!open}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="전체 메뉴 닫기"
        onClick={onClose}
      />

      <aside
        id="site-drawer"
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="전체 메뉴"
      >
        <div className={styles.panelHead}>
          <span className={styles.panelTitle}>메뉴</span>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="전체 메뉴 닫기"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <nav className={styles.nav} aria-label="전체 메뉴">
          {DRAWER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
