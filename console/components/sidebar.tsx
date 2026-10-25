"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import BrandMark from "./brand-mark";
import styles from "./sidebar.module.css";

const NAV = [
  { href: "/", label: "대시보드", icon: "◎" },
  { href: "/reports", label: "신고함", icon: "⚑" },
  { href: "/content", label: "그림 신고", icon: "▨" },
  { href: "/portraits", label: "초상 검수", icon: "▣" },
  { href: "/characters", label: "캐릭터", icon: "☆" },
  { href: "/users", label: "계정 등급", icon: "◐" },
];

export default function Sidebar({ admin }: { admin: { displayName: string; email: string } }) {
  const pathname = usePathname();
  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.brand}>
        <BrandMark size={28} id="console-brand" />
        <span>
          <strong>코디컴퍼챗</strong>
          <small>운영 콘솔</small>
        </span>
      </Link>
      <nav className={styles.nav} aria-label="콘솔 메뉴">
        {NAV.map((item) => {
          const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={styles.link} aria-current={current ? "page" : undefined}>
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className={styles.account}>
        <p className={styles.who}>
          <strong>{admin.displayName}</strong>
          <span>{admin.email}</span>
        </p>
        <form action={logout}>
          <button type="submit" className={styles.logout}>
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
