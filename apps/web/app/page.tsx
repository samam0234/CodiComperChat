import CharacterList from "@/components/character-list";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <section>
      <h1 className={styles.title}>홈</h1>
      <p className={styles.description}>
        진행 중인 캠페인과 시작할 캐릭터가 놓일 자리입니다.
      </p>

      <h2 className={styles.sectionTitle}>진행 중인 캠페인</h2>
      <p className={styles.placeholder}>
        진행 중인 캠페인 카드 (지난 세션에서 남은 것 한 줄)
      </p>

      <h2 className={styles.sectionTitle}>캐릭터 선택</h2>
      <CharacterList emptyMessage="아직 시작할 수 있는 캐릭터가 없습니다." />
    </section>
  );
}
