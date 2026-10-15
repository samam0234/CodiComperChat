import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import styles from "../reports/reports-board.module.css";
import PlanTool from "./plan-tool";

export const metadata: Metadata = { title: "계정 등급 · 코디컴퍼챗" };

export default async function AdminUsersPage() {
  const user = await requireUser("/admin/users");
  if (user.role !== "ADMIN") notFound();

  return (
    <section>
      <Link href="/me" className={styles.back}>
        ← 마이페이지
      </Link>
      <h1 className={styles.title}>계정 등급</h1>
      <p className={styles.description}>
        이메일로 계정을 찾아 요금 등급을 직접 바꿉니다. 환불·보상·시험 계정용이며 결제 기록은 바뀌지 않습니다. 일수를 비우면 만료
        없는 프로입니다.
      </p>
      <PlanTool />
    </section>
  );
}
