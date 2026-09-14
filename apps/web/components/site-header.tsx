"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SiteDrawer from "./site-drawer";
import styles from "./site-header.module.css";

const HEADER_NAV = [
  { href: "/", label: "홈" },
  { href: "/popular", label: "인기" },
  { href: "/agents", label: "에이전트" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.brand}>
            코디컴퍼챗
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
      </header>

      <SiteDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
