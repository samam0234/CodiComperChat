import Link from "next/link";
import { requireUser, safeNextPath } from "@/lib/auth";
import { getMyOrders, won } from "@/lib/billing";
import { formatDay } from "@/lib/format-time";
import { PERSONA_LIMIT, getMyPersonas } from "@/lib/personas";
import Personas from "./personas";
import VerifyEmailNotice from "./verify-email-notice";
import styles from "./page.module.css";

export default async function MyPage({ searchParams }: PageProps<"/me">) {
  const user = await requireUser("/me");
  const [personas, billing] = await Promise.all([getMyPersonas(), getMyOrders()]);
  const joined = new Date(user.createdAt).toLocaleDateString("ko-KR");
  // 채팅에서 프로필을 만들러 온 경우 돌아갈 길을 준다 (사이트 안 경로만 허용)
  const back = safeNextPath((await searchParams).back);

  return (
    <>
      {back !== "/" && (
        <Link href={back} className={styles.back}>
          ← 대화로 돌아가기
        </Link>
      )}
      <h1 className={styles.title}>마이페이지</h1>

      <dl className={styles.account}>
        <div className={styles.row}>
          <dt>표시 이름</dt>
          <dd>{user.displayName}</dd>
        </div>
        <div className={styles.row}>
          <dt>이메일</dt>
          <dd>
            {user.email} {user.emailVerified ? "(인증됨)" : "(미인증)"}
          </dd>
        </div>
        <div className={styles.row}>
          <dt>요금 등급</dt>
          <dd>
            {user.plan === "PRO"
              ? `프로 (공방 긴 글 칸 3배${billing?.planUntil ? `, ${formatDay(billing.planUntil)}까지` : ""})`
              : "무료"}{" "}
            <Link href="/pricing" className={styles.inlineLink}>
              {user.plan === "PRO" ? "기간 늘리기" : "프로 알아보기"}
            </Link>
          </dd>
        </div>
        <div className={styles.row}>
          <dt>가입일</dt>
          <dd>{joined}</dd>
        </div>
      </dl>

      {!user.emailVerified && <VerifyEmailNotice />}

      {billing && billing.orders.length > 0 && (
        <section className={styles.orders} aria-label="결제 내역">
          <h2 className={styles.ordersTitle}>결제 내역</h2>
          <ul>
            {billing.orders.map((o) => (
              <li key={o.id}>
                {formatDay(o.paidAt)} · {o.name} · {won(o.amount)}
                {o.status === "REFUNDED" && " · 환불됨"}
                {o.receiptUrl && (
                  <>
                    {" "}
                    <a href={o.receiptUrl} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                      영수증
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href="/settings" className={styles.link}>
        계정 설정으로 가기 →
      </Link>

      {user.role === "ADMIN" && (
        <>
          <Link href="/admin/reports" className={styles.link}>
            운영자 · 신고함 →
          </Link>
          <Link href="/admin/portraits" className={styles.link}>
            운영자 · 초상 검수 →
          </Link>
          <Link href="/admin/users" className={styles.link}>
            운영자 · 계정 등급 →
          </Link>
        </>
      )}

      <Personas personas={personas} limit={PERSONA_LIMIT} />

      <section className={styles.upcoming}>
        <h2 className={styles.upcomingTitle}>준비 중</h2>
        <p>내가 만든 캐릭터 카드</p>
      </section>
    </>
  );
}
