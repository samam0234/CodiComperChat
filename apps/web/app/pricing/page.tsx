import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getBillingInfo, won } from "@/lib/billing";
import BuyButton from "./buy-button";
import styles from "./pricing.module.css";

export const metadata: Metadata = { title: "요금 안내 · 코디컴퍼챗" };

const FREE = ["공식·공개 캐릭터와 대화", "캐릭터 공방에서 내 캐릭터 만들기·발행", "긴 글 칸(설정·장면·첫 메시지·로어) 기본 글자 수"];
const PRO = ["무료의 모든 기능", "긴 글 칸 글자 수 3배 (예: 첫 메시지 400자 → 1,200자)", "이름·호칭·예시 대화처럼 매 턴 들어가는 칸은 그대로라 캐릭터가 흐트러지지 않아요"];

export default async function PricingPage() {
  const [user, info] = await Promise.all([getCurrentUser(), getBillingInfo()]);

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>요금 안내</h1>
      <p className={styles.lead}>캐릭터를 더 깊이 쓰고 싶을 때 프로로 올려 보세요. 결제한 기간이 지나면 자동으로 무료로 돌아가고, 자동 결제는 없어요.</p>

      <div className={styles.plans}>
        <article className={styles.plan} aria-label="무료">
          <h2 className={styles.planName}>무료</h2>
          <p className={styles.price}>0원</p>
          <ul className={styles.features}>
            {FREE.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {user?.plan === "FREE" && <p className={styles.current}>지금 쓰는 등급</p>}
        </article>

        <article className={`${styles.plan} ${styles.pro}`} aria-label="프로">
          <h2 className={styles.planName}>프로</h2>
          <ul className={styles.features}>
            {PRO.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {user?.plan === "PRO" && <p className={styles.current}>지금 쓰는 등급 · 결제하면 남은 기간 뒤에 이어 붙어요</p>}

          {!info ? (
            <p className={styles.notice}>요금 정보를 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.</p>
          ) : !info.provider ? (
            <p className={styles.notice}>결제는 준비 중이에요. 프로가 필요하면 고객센터로 문의해 주세요.</p>
          ) : (
            <ul className={styles.products}>
              {info.products.map((p) => (
                <li key={p.id} className={styles.product}>
                  <div>
                    <p className={styles.productName}>{p.name}</p>
                    <p className={styles.productPrice}>{won(p.amount)}</p>
                  </div>
                  {user ? (
                    <BuyButton productId={p.id} label={`${p.name} 결제`} provider={info.provider!} />
                  ) : (
                    <Link href="/login?next=/pricing" className={styles.loginLink}>
                      로그인하고 결제
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
          {info?.provider === "mock" && (
            <p className={styles.testMode}>지금은 시험 모드예요. 실제 돈이 나가지 않는 가짜 결제창이 열립니다.</p>
          )}
        </article>
      </div>

      <p className={styles.fine}>
        결제 후 환불·문의는 <Link href="/support">고객센터</Link>로 연락해 주세요. 가격은 정식 출시 전 바뀔 수 있어요.
      </p>
    </section>
  );
}
