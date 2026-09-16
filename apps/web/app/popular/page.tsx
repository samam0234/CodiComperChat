import CharacterList from "@/components/character-list";
import styles from "./page.module.css";

export default function PopularPage() {
  return (
    <section>
      <h1 className={styles.title}>인기</h1>
      <p className={styles.description}>
        많이 플레이된 캐릭터와 캠페인을 모아 보는 자리입니다.
      </p>

      <h2 className={styles.sectionTitle}>인기 캐릭터</h2>
      <p className={styles.note}>
        플레이 횟수 집계가 아직 없어 발행 순으로 보여 줍니다.
      </p>
      <CharacterList emptyMessage="아직 발행된 캐릭터가 없습니다." />

      <h2 className={styles.sectionTitle}>인기 캠페인</h2>
      <p className={styles.placeholder}>인기 캠페인 목록</p>
    </section>
  );
}
