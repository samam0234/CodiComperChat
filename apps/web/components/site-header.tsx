"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import BrandMark from "./brand-mark";
import SiteDrawer, { type Viewer } from "./site-drawer";
import ThemeToggle from "./theme-toggle";
import type { Shade, ThemeMode, ThemeOverride } from "@/lib/theme-schedule";
import styles from "./site-header.module.css";

const HEADER_NAV = [
  { href: "/", label: "홈" },
  { href: "/popular", label: "인기" },
  { href: "/agents", label: "에이전트" },
];

export default function SiteHeader({
  viewer,
  theme,
}: {
  viewer: Viewer;
  theme: { mode: ThemeMode; override: ThemeOverride | null; shade: Shade };
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.brand} aria-label="코디컴퍼챗 홈">
            <BrandMark id="header-brand" />
            <span className={styles.brandText}>코디컴퍼챗</span>
          </Link>

          <nav className={styles.nav} aria-label="주요 메뉴">
            {HEADER_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navLink}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            {viewer ? (
              <>
                <Link href="/studio" className={styles.create}>
                  <span aria-hidden="true">＋</span> 캐릭터 만들기
                </Link>
                {/* 캐릭터 만들기 옆의 밝기 버튼 */}
                <ThemeToggle mode={theme.mode} override={theme.override} shade={theme.shade} />
                <Link href="/me" className={styles.me} title={`${viewer.displayName} · 마이페이지`} aria-label="마이페이지">
                  {viewer.displayName.trim().slice(0, 1) || "나"}
                </Link>
              </>
            ) : (
              <>
                <ThemeToggle mode={theme.mode} override={theme.override} shade={theme.shade} />
                <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={styles.login}>
                  시작하기
                </Link>
              </>
            )}
            <button
              type="button"
              className={styles.menuButton}
              aria-label="전체 메뉴 열기"
              aria-expanded={drawerOpen}
              aria-controls="site-drawer"
              onClick={() => setDrawerOpen(true)}
            >
              <span className={styles.menuBar} />
              <span className={styles.menuBar} />
              <span className={styles.menuBar} />
            </button>
          </div>
        </div>
      </header>

      <SiteDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        viewer={viewer}
      />
    </>
  );
}
