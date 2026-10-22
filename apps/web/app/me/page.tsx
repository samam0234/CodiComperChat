import Link from "next/link";
import { CONSOLE_BASE_URL, requireUser, safeNextPath } from "@/lib/auth";
import { getMyOrders, won } from "@/lib/billing";
import { getCredits } from "@/lib/credits";
import { formatDay } from "@/lib/format-time";
import { PERSONA_LIMIT, getMyPersonas } from "@/lib/personas";
import CreditsCard from "./credits-card";
import Personas from "./personas";
import VerifyEmailNotice from "./verify-email-notice";
import styles from "./page.module.css";

const PRO_PERKS = ["공방 긴 글 칸 3배", "강화 무료 모델(gemma4:12b) 무제한", "출석 코레딧 하루 5,000"];
const FREE_PERKS = ["공방 긴 글 칸 기본 길이", "강화 무료 모델 하루 30번", "출석 코레딧 하루 1,000"];

// 이름의 첫 글자를 동그라미에 넣는다 (이모지처럼 두 칸 글자도 깨지지 않게 코드 포인트 기준)
const initialOf = (name: string) => Array.from(name.trim())[0] ?? "?";

export default async function MyPage({ searchParams }: PageProps<"/me">) {
  const user = await requireUser("/me");
  const [personas, billing, credits] = await Promise.all([getMyPersonas(), getMyOrders(), getCredits()]);
  const joined = new Date(user.createdAt).toLocaleDateString("ko-KR");
  // 채팅에서 프로필을 만들러 온 경우 돌아갈 길을 준다 (사이트 안 경로만 허용)
  const back = safeNextPath((await searchParams).back);
  const pro = user.plan === "PRO";

  return (
    <div className={styles.page}>
      {back !== "/" && (
        <Link href={back} className={styles.back}>
          ← 대화로 돌아가기
        </Link>
      )}

      <header className={styles.hero}>
        <span className={styles.avatar} aria-hidden="true">
          {initialOf(user.displayName)}
        </span>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>마이페이지</p>
          <h1 className={styles.title}>{user.displayName}</h1>
          <p className={styles.email}>
            <span>{user.email}</span>{" "}
            <span className={user.emailVerified ? styles.verified : styles.unverified}>
              {user.emailVerified ? "(인증됨)" : "(미인증)"}
            </span>
          </p>
          <ul className={styles.badges} aria-label="계정 정보">
            <li className={pro ? styles.badgePro : styles.badge}>{pro ? "프로" : "무료"}</li>
            {user.role === "ADMIN" && <li className={styles.badge}>운영자</li>}
            <li className={styles.badge}>{joined} 가입</li>
          </ul>
        </div>
        <div className={styles.heroActions}>
          <Link href="/settings" className={styles.primaryAction}>
            계정 설정
          </Link>
          {user.role === "ADMIN" && (
            // 운영자 화면은 별도 운영 콘솔(console/, 기본 3001)에 있다. 콘솔은 따로 로그인한다
            <a href={CONSOLE_BASE_URL} className={styles.secondaryAction} target="_blank" rel="noopener noreferrer">
              운영 콘솔 열기 →
            </a>
          )}
        </div>
      </header>

      {!user.emailVerified && <VerifyEmailNotice />}

      <nav className={styles.shortcuts} aria-label="바로가기">
        <Link href="/library" className={styles.shortcut}>
          <strong>대화 목록</strong>
          <span>이어서 말할 캐릭터</span>
        </Link>
        <Link href="/studio" className={styles.shortcut}>
          <strong>캐릭터 공방</strong>
          <span>내 캐릭터 만들기</span>
        </Link>
        <Link href="/pricing" className={styles.shortcut}>
          <strong>요금 안내</strong>
          <span>프로 등급 알아보기</span>
        </Link>
      </nav>

      <div className={styles.grid}>
        {credits && <CreditsCard summary={credits} />}

        <section className={styles.planCard} aria-labelledby="plan-title">
          <div className={styles.cardHead}>
            <h2 id="plan-title" className={styles.cardTitle}>
              요금 등급
            </h2>
            <span className={pro ? styles.badgePro : styles.badge}>{pro ? "프로" : "무료"}</span>
          </div>
          <p className={styles.planName}>{pro ? "프로 (공방 긴 글 칸 3배)" : "무료"}</p>
          {pro && billing?.planUntil && <p className={styles.planUntil}>{formatDay(billing.planUntil)}까지</p>}
          <ul className={styles.perks}>
            {(pro ? PRO_PERKS : FREE_PERKS).map((perk) => (
              <li key={perk}>{perk}</li>
            ))}
          </ul>
          <Link href="/pricing" className={styles.cardLink}>
            {pro ? "기간 늘리기" : "프로 알아보기"}
          </Link>
        </section>
      </div>

      {billing && billing.orders.length > 0 && (
        <section className={styles.orders} aria-label="결제 내역">
          <h2 className={styles.cardTitle}>결제 내역</h2>
          <ul>
            {billing.orders.map((o) => (
              <li key={o.id}>
                <span className={styles.orderDate}>{formatDay(o.paidAt)}</span>
                <span className={styles.orderName}>
                  {o.name}
                  {o.status === "REFUNDED" && " · 환불됨"}
                </span>
                <span className={styles.orderAmount}>{won(o.amount)}</span>
                {o.receiptUrl && (
                  <a href={o.receiptUrl} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                    영수증
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Personas personas={personas} limit={PERSONA_LIMIT} />
    </div>
  );
}
