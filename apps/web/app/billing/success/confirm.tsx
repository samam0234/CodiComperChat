"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { confirmPayment } from "@/app/actions/billing";
import { formatDay } from "@/lib/format-time";
import styles from "@/components/form.module.css";

type State = { status: "pending" } | { status: "done"; planUntil: string | null } | { status: "error"; error: string };

// 화면이 열리면 한 번 승인을 요청한다. 서버는 같은 주문을 두 번 승인해도 한 번만 반영한다(새로고침해도 안전)
export default function Confirm({ paymentKey, orderId, amount }: { paymentKey: string; orderId: string; amount: number }) {
  const [state, setState] = useState<State>({ status: "pending" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void confirmPayment({ paymentKey, orderId, amount }).then((result) =>
      setState(result.ok ? { status: "done", planUntil: result.data.planUntil } : { status: "error", error: result.error }),
    );
  }, [paymentKey, orderId, amount]);

  if (state.status === "pending") {
    return (
      <p className={styles.subtitle} role="status">
        결제를 확인하고 있어요…
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <>
        <p className={styles.error} role="alert">
          {state.error}
        </p>
        <p className={styles.switch}>
          <Link href="/pricing">요금 안내로 돌아가기</Link>
        </p>
      </>
    );
  }
  return (
    <>
      <p className={styles.success} role="status">
        결제가 끝났어요. 프로 등급이 적용됐어요{state.planUntil ? ` (${formatDay(state.planUntil)}까지)` : ""}.
      </p>
      <p className={styles.switch}>
        <Link href="/studio">공방으로 가기</Link> · <Link href="/me">마이페이지</Link>
      </p>
    </>
  );
}
