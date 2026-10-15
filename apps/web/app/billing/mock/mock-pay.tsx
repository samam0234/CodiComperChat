"use client";

import Link from "next/link";
import styles from "@/components/form.module.css";

export default function MockPay({ orderId, amount }: { orderId: string; amount: string }) {
  // 결제사가 붙여 주는 값과 같은 이름으로 돌려보낸다
  const key = `mock_${orderId}`;
  const success = `/billing/success?${new URLSearchParams({ paymentKey: key, orderId, amount })}`;
  const fail = `/billing/fail?${new URLSearchParams({ code: "PAY_PROCESS_CANCELED", message: "결제를 취소했어요." })}`;

  return (
    <div className={styles.form}>
      <Link href={success} className={styles.submit} style={{ display: "grid", placeItems: "center" }}>
        시험 결제 승인
      </Link>
      <Link href={fail} className={styles.secondary} style={{ display: "grid", placeItems: "center" }}>
        취소
      </Link>
    </div>
  );
}
