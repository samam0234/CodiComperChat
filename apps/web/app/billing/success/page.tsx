import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import styles from "@/components/form.module.css";
import Confirm from "./confirm";

export const metadata: Metadata = { title: "결제 확인 · 코디컴퍼챗" };

// 결제창(토스·시험 결제)이 돌려보내는 곳. 여기서 서버에 승인을 받아야 결제가 끝난다
export default async function BillingSuccessPage({ searchParams }: PageProps<"/billing/success">) {
  await requireUser("/pricing");
  const { paymentKey, orderId, amount } = await searchParams;
  const valid = typeof paymentKey === "string" && typeof orderId === "string" && typeof amount === "string";

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>결제 확인</h1>
      {valid ? (
        <Confirm paymentKey={paymentKey} orderId={orderId} amount={Number(amount)} />
      ) : (
        <p className={styles.subtitle}>
          결제 정보가 없어요. <Link href="/pricing">요금 안내</Link>에서 다시 시도해 주세요.
        </p>
      )}
    </section>
  );
}
