import styles from "./page-placeholder.module.css";

type PagePlaceholderProps = {
  title: string;
  description: string;
  items?: string[];
};

export default function PagePlaceholder({
  title,
  description,
  items,
}: PagePlaceholderProps) {
  return (
    <section>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>

      {items && (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item} className={styles.item}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
