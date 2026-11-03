"use client";

import { useState, useTransition } from "react";
import { findOrders, findUser, refundOrder, setUserBirthDate, setUserPlan, type AdminOrder, type AdminUser } from "@/app/actions/admin";
import { formatDay } from "@/lib/format-time";
import form from "@/components/form.module.css";
import styles from "./plan-tool.module.css";

export default function PlanTool() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [refundReason, setRefundReason] = useState("");
  const [days, setDays] = useState("30");
  const [birthDate, setBirthDate] = useState("");
  const [birthReason, setBirthReason] = useState("");
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, startTransition] = useTransition();

  const search = () =>
    startTransition(async () => {
      setMessage(null);
      const result = await findUser(email);
      if (result.ok) {
        setUser(result.data);
        const list = await findOrders(email);
        setOrders(list.ok ? list.data : []);
      } else {
        setUser(null);
        setOrders([]);
        setMessage({ tone: "error", text: result.error });
      }
    });

  const apply = (plan: "PRO" | "FREE") =>
    startTransition(async () => {
      if (!user) return;
      setMessage(null);
      const result = await setUserPlan(user.email, plan, plan === "PRO" ? days : "");
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      const found = await findUser(user.email);
      if (found.ok) setUser(found.data);
      setMessage({ tone: "success", text: `${user.email} → ${plan === "PRO" ? "프로" : "무료"}` });
    });

  const fixBirthDate = () =>
    startTransition(async () => {
      if (!user) return;
      setMessage(null);
      const result = await setUserBirthDate(user.email, birthDate, birthReason);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setUser({ ...user, age: result.data.age });
      setBirthDate("");
      setBirthReason("");
      setMessage({ tone: "success", text: "생년월일을 고쳤습니다. 성인 확인을 했다면 이용자가 다시 해야 합니다." });
    });

  const refund = (order: AdminOrder) =>
    startTransition(async () => {
      if (!user) return;
      setMessage(null);
      const result = await refundOrder(order.id, refundReason);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      const [found, list] = await Promise.all([findUser(user.email), findOrders(user.email)]);
      if (found.ok) setUser(found.data);
      if (list.ok) setOrders(list.data);
      setRefundReason("");
      setMessage({ tone: "success", text: `${order.name} 결제를 환불했습니다.` });
    });

  return (
    <div className={styles.tool}>
      <form
        className={styles.search}
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <input className={form.input} type="email" placeholder="계정 이메일" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="계정 이메일" required />
        <button type="submit" className={form.secondary} disabled={busy}>
          찾기
        </button>
      </form>

      {user && (
        <section className={styles.user} aria-label="찾은 계정">
          <p className={styles.name}>
            {user.displayName} <span>{user.email}</span>
          </p>
          <p className={styles.meta}>
            지금 등급: <strong>{user.effectivePlan === "PRO" ? "프로" : "무료"}</strong>
            {user.effectivePlan === "PRO" && (user.planUntil ? ` (${formatDay(user.planUntil)}까지)` : " (만료 없음)")} · 가입 {formatDay(user.createdAt)}
          </p>
          <p className={styles.meta}>나이 확인: {user.age === null ? "입력 안 함" : `만 ${user.age}세`}</p>
          <div className={styles.actions} role="group" aria-label="생년월일 고치기">
            <input
              className={form.input}
              placeholder="새 생년월일 YYYY-MM-DD (비우면 지움)"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              aria-label="새 생년월일"
            />
            <input
              className={form.input}
              placeholder="고치는 사유"
              value={birthReason}
              onChange={(e) => setBirthReason(e.target.value)}
              aria-label="고치는 사유"
            />
            <button type="button" className={form.secondary} disabled={busy} onClick={fixBirthDate}>
              생년월일 고치기
            </button>
          </div>
          {orders.length > 0 && (
            <div className={styles.orders} aria-label="결제 내역">
              <input
                className={form.input}
                placeholder="환불 사유 (결제사와 기록에 남습니다)"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                aria-label="환불 사유"
              />
              <ul>
                {orders.map((o) => (
                  <li key={o.id} className={styles.order}>
                    <span>
                      {formatDay(o.paidAt)} · {o.name} · {o.amount.toLocaleString("ko-KR")}원{o.provider === "mock" ? " (시험 결제)" : ""}
                    </span>
                    {o.status === "REFUNDED" ? (
                      <span className={styles.refunded}>환불됨 {o.refundReason ? `· ${o.refundReason}` : ""}</span>
                    ) : (
                      <button type="button" className={form.secondary} disabled={busy} onClick={() => refund(o)}>
                        환불
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className={styles.actions}>
            <label className={styles.days}>
              <input className={form.input} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} aria-label="프로 일수" />일
            </label>
            <button type="button" className={form.submit} disabled={busy} onClick={() => apply("PRO")}>
              프로로
            </button>
            <button type="button" className={form.secondary} disabled={busy} onClick={() => apply("FREE")}>
              무료로
            </button>
          </div>
        </section>
      )}

      {message && (
        <p className={message.tone === "error" ? form.error : form.success} role={message.tone === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
