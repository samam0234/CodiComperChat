"use client";

import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";
import styles from "./pricing.module.css";

// 결제 전에 주문 내용·환불 기준을 확인했다는 동의 (전자상거래: 결제 전 확인 절차). 동의해야 결제 버튼이 눌린다
const ConsentContext = createContext(false);

export function useConsent() {
  return useContext(ConsentContext);
}

export default function PurchaseConsent({ children }: { children: ReactNode }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <ConsentContext.Provider value={agreed}>
      <section className={styles.refund} aria-label="환불 안내">
        <p>
          결제한 날부터 7일 이내이고 프로 기능을 아직 쓰지 않았다면 전액 환불돼요. 쓰기 시작한 뒤의 기준과 자세한 내용은{" "}
          <Link href="/terms#s8">이용약관 · 청약철회와 환불</Link>을 확인해 주세요. 자동 결제는 없어요.
        </p>
        <label className={styles.consent}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          주문 내용(상품·기간·금액)과 환불 기준을 확인했고 결제에 동의합니다
        </label>
      </section>
      {children}
    </ConsentContext.Provider>
  );
}
