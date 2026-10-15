import type { ReactNode } from "react";
import styles from "./legal-doc.module.css";

export type LegalSection = { title: string; body: ReactNode };

// 약관·처리방침 같은 긴 문서 틀. 아직 법률 검토를 받지 않은 초안이면 draft를 켜서 그 사실을 맨 위에 밝힌다
export default function LegalDoc({
  title,
  updated,
  draft = false,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  draft?: boolean;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <article className={styles.doc}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.meta}>최종 수정 {updated}</p>
      {draft && (
        <p className={styles.draft} role="note">
          이 문서는 <strong>초안</strong>입니다. 서비스를 공개하기 전에 법률 검토를 받고, <mark>[대괄호]</mark> 칸을 운영자가 채워야 합니다.
        </p>
      )}
      {intro && <div className={styles.intro}>{intro}</div>}
      <nav className={styles.toc} aria-label="목차">
        <ol>
          {sections.map((s, i) => (
            <li key={s.title}>
              <a href={`#s${i + 1}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      {sections.map((s, i) => (
        <section key={s.title} id={`s${i + 1}`} className={styles.section}>
          <h2 className={styles.heading}>
            {i + 1}. {s.title}
          </h2>
          <div className={styles.body}>{s.body}</div>
        </section>
      ))}
    </article>
  );
}
