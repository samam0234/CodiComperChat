import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/form.module.css";

export const metadata: Metadata = { title: "결제 실패 · 코디컴퍼챗" };

// 결제창에서 취소했거나 결제사가 거절했을 때 돌아오는 곳. 돈은 빠져나가지 않았다
export default async function BillingFailPage({ searchParams }: PageProps<"/billing/fail">) {
  const { message } = await searchParams;
  return (
    <section className={styles.card}>
      <h1 className={styles.title}>결제가 끝나지 않았어요</h1>
      <p className={styles.subtitle}>
        {typeof message === "string" && message ? message.slice(0, 200) : "결제가 취소됐거나 실패했어요."} 결제 금액은 청구되지 않았어요.
      </p>
      <p className={styles.switch}>
        <Link href="/pricing">요금 안내로 돌아가기</Link>
      </p>
    </section>
  );
}
