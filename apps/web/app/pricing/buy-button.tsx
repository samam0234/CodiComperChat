"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { startCheckout, type Checkout } from "@/app/actions/billing";
import styles from "./pricing.module.css";

type TossPayment = { requestPayment: (options: Record<string, unknown>) => Promise<void> };
type TossPaymentsFactory = (clientKey: string) => { payment: (options: { customerKey: string }) => TossPayment };

const TOSS_SDK = "https://js.tosspayments.com/v2/standard";

// 토스 결제창 스크립트는 결제를 누를 때만 받는다 (모든 화면에 외부 스크립트를 싣지 않게)
function loadToss(): Promise<TossPaymentsFactory> {
  const existing = (window as unknown as { TossPayments?: TossPaymentsFactory }).TossPayments;
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TOSS_SDK;
    script.onload = () => {
      const factory = (window as unknown as { TossPayments?: TossPaymentsFactory }).TossPayments;
      if (factory) resolve(factory);
      else reject(new Error("결제창을 불러오지 못했어요."));
    };
    script.onerror = () => reject(new Error("결제창을 불러오지 못했어요."));
    document.head.appendChild(script);
  });
}

async function openToss(order: Checkout) {
  const TossPayments = await loadToss();
  const payment = TossPayments(order.clientKey!).payment({ customerKey: order.customerKey });
  const origin = window.location.origin;
  // 결제를 마치면 토스가 successUrl에 paymentKey·orderId·amount를 붙여 돌려보낸다
  await payment.requestPayment({
    method: "CARD",
    amount: { currency: "KRW", value: order.amount },
    orderId: order.orderId,
    orderName: order.orderName,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    successUrl: `${origin}/billing/success`,
    failUrl: `${origin}/billing/fail`,
  });
}

export default function BuyButton({ productId, label, provider }: { productId: string; label: string; provider: "toss" | "mock" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await startCheckout(productId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data.provider === "toss") {
        await openToss(result.data);
      } else {
        const q = new URLSearchParams({ orderId: result.data.orderId, amount: String(result.data.amount), orderName: result.data.orderName });
        router.push(`/billing/mock?${q}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제를 시작하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.buy}>
      <button type="button" className={styles.buyButton} onClick={() => void buy()} disabled={busy} aria-label={label}>
        {busy ? "결제창 여는 중…" : provider === "mock" ? "시험 결제" : "결제하기"}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
