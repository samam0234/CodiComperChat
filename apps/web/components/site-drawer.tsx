"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { logout } from "@/app/actions/auth";
import styles from "./site-drawer.module.css";

export type Viewer = { displayName: string } | null;

const DRAWER_NAV = [
  { href: "/", label: "홈", memberOnly: false },
  { href: "/library", label: "대화 목록 (라이브러리)", memberOnly: true },
  { href: "/studio", label: "제작", memberOnly: true },
  { href: "/me", label: "마이페이지", memberOnly: true },
  { href: "/pricing", label: "요금 안내", memberOnly: false },
  { href: "/settings", label: "설정", memberOnly: false },
];

type SiteDrawerProps = {
  open: boolean;
  onClose: () => void;
  viewer: Viewer;
};

export default function SiteDrawer({ open, onClose, viewer }: SiteDrawerProps) {
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
          {DRAWER_NAV.map((item) => {
            const locked = item.memberOnly && !viewer;
            return (
              <Link
                key={item.href}
                href={
                  locked
                    ? `/login?next=${encodeURIComponent(item.href)}`
                    : item.href
                }
                className={styles.navLink}
                aria-current={pathname === item.href ? "page" : undefined}
                onClick={onClose}
              >
                {item.label}
                {locked && <span className={styles.lock}>로그인 필요</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.account}>
          {viewer ? (
            <>
              <p className={styles.viewer}>
                <strong>{viewer.displayName}</strong> 님
              </p>
              <form action={logout}>
                <button type="submit" className={styles.accountButton}>
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <div className={styles.accountActions}>
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className={styles.loginLink}
                onClick={onClose}
              >
                로그인
              </Link>
              <Link
                href={`/signup?next=${encodeURIComponent(pathname)}`}
                className={styles.accountButton}
                onClick={onClose}
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
