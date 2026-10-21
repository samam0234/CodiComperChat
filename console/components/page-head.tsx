import type { ReactNode } from "react";
import styles from "./page-head.module.css";

export default function PageHead({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <header className={styles.head}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children && <div className={styles.side}>{children}</div>}
    </header>
  );
}
