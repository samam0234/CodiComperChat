import Link from "next/link";
import styles from "./site-footer.module.css";

const FOOTER_LINKS = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/business", label: "사업자 정보확인" },
  { href: "/support", label: "고객센터" },
];

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <nav className={styles.links} aria-label="약관 및 정책">
          {FOOTER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className={styles.link}>
              {item.label}
            </Link>
          ))}
        </nav>
        <p className={styles.copyright}>© 2026 코디컴퍼챗</p>
      </div>
    </footer>
  );
}
