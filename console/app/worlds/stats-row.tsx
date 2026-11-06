import Link from "next/link";
import type { WorldStats } from "@/lib/worlds";
import styles from "./worlds.module.css";

// 월드코퍼챗 숫자 한 줄 (목록·대시보드)
export default function StatsRow({ stats }: { stats: WorldStats | null }) {
  if (!stats) return <p className={styles.error}>통계를 불러오지 못했습니다.</p>;
  return (
    <div className={styles.stats}>
      <div className={styles.stat}>
        <span>세계관</span>
        <strong>{stats.worlds}</strong>
      </div>
      <div className={styles.stat}>
        <span>공개 중</span>
        <strong>{stats.published}</strong>
      </div>
      <div className={styles.stat}>
        <span>내려감</span>
        <strong>{stats.takenDown}</strong>
      </div>
      <div className={styles.stat}>
        <span>플레이</span>
        <strong>{stats.plays}</strong>
      </div>
      <Link href="/worlds/review" className={`${styles.stat} ${stats.pendingReview > 0 ? styles.alert : ""}`}>
        <span>검수 대기 그림·지도</span>
        <strong>{stats.pendingReview}</strong>
      </Link>
      <Link href="/worlds/events" className={styles.stat}>
        <span>오늘 이벤트 ({stats.today.day})</span>
        <strong>{stats.today.events}</strong>
        <span>
          보상 {stats.today.rewarded}번 · {stats.today.credits.toLocaleString()} 코레딧
        </span>
      </Link>
    </div>
  );
}

