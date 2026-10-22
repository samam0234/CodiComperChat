import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getBillingInfo, won } from "@/lib/billing";
import styles from "@/components/form.module.css";
import MockPay from "./mock-pay";

export const metadata: Metadata = { title: "시험 결제 · 코디컴퍼챗" };

// 가짜 결제창. 실제 결제사 대신 "결제했다"고 치고 결제사와 같은 방식으로 /billing/success에 돌려보낸다.
// 서버가 가짜 결제를 켜 두었을 때만 열린다(운영에서는 기본으로 꺼져 있다)
export default async function MockCheckoutPage({ searchParams }: PageProps<"/billing/mock">) {
  await requireUser("/pricing");
  const info = await getBillingInfo();
  if (info?.provider !== "mock") notFound();
  const { orderId, amount, orderName } = await searchParams;
  if (typeof orderId !== "string" || typeof amount !== "string") notFound();

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>시험 결제</h1>
      <p className={styles.subtitle}>
        실제 돈이 나가지 않는 가짜 결제창이에요. {typeof orderName === "string" ? orderName : "주문"} · {won(Number(amount))}
      </p>
      <MockPay orderId={orderId} amount={amount} />
    </section>
  );
}
