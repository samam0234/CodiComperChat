import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PERSONA_LIMIT, getMyPersonas } from "@/lib/personas";
import Personas from "./personas";
import styles from "./page.module.css";

export default async function MyPage() {
  const user = await requireUser("/me");
  const personas = await getMyPersonas();
  const joined = new Date(user.createdAt).toLocaleDateString("ko-KR");

  return (
    <>
      <h1 className={styles.title}>마이페이지</h1>

      <dl className={styles.account}>
        <div className={styles.row}>
          <dt>표시 이름</dt>
          <dd>{user.displayName}</dd>
        </div>
        <div className={styles.row}>
          <dt>이메일</dt>
          <dd>{user.email}</dd>
        </div>
        <div className={styles.row}>
          <dt>가입일</dt>
          <dd>{joined}</dd>
        </div>
      </dl>

      <Link href="/settings" className={styles.link}>
        계정 설정으로 가기 →
      </Link>

      <Personas personas={personas} limit={PERSONA_LIMIT} />

      <section className={styles.upcoming}>
        <h2 className={styles.upcomingTitle}>준비 중</h2>
        <p>내가 만든 캐릭터 카드</p>
      </section>
    </>
  );
}
