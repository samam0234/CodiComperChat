import Link from "next/link";
import PagePlaceholder from "@/components/page-placeholder";
import { requireUser } from "@/lib/auth";
import styles from "./page.module.css";

export default async function MyPage() {
  const user = await requireUser("/me");
  const joined = new Date(user.createdAt).toLocaleDateString("ko-KR");

  return (
    <>
      <PagePlaceholder
        title="마이페이지"
        description="내 계정과 내 주인공 정보가 놓일 자리입니다."
        items={["프로필 / 주인공 호칭", "내가 만든 카드"]}
      />

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
    </>
  );
}
