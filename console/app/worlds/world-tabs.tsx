import Link from "next/link";
import styles from "./worlds.module.css";

const TABS = [
  { href: "/worlds", label: "세계관 목록" },
  { href: "/worlds/review", label: "그림·지도 검수" },
  { href: "/worlds/events", label: "이벤트 기록" },
  { href: "/worlds/settings", label: "운영 설정" },
] as const;

// 월드코퍼챗 운영 화면의 하위 메뉴
export default function WorldTabs({ current, pending }: { current: (typeof TABS)[number]["href"]; pending?: number }) {
  return (
    <nav className={styles.tabs} aria-label="월드코퍼챗 메뉴">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={styles.tab} aria-current={current === t.href ? "page" : undefined}>
          {t.label}
          {t.href === "/worlds/review" && pending ? <span className={styles.count}>{pending}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
