import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPendingPortraits } from "@/lib/admin";
import { requireUser } from "@/lib/auth";
import styles from "../reports/reports-board.module.css";
import PortraitBoard from "./portrait-board";

export const metadata: Metadata = { title: "초상 검수 · 코디컴퍼챗" };

export default async function AdminPortraitsPage() {
  const user = await requireUser("/admin/portraits");
  // 운영자가 아니면 이 화면이 있는지도 모르게 404. 진짜 권한 확인은 Nest(AdminGuard)가 한다
  if (user.role !== "ADMIN") notFound();
  const pending = await getPendingPortraits();

  return (
    <section>
      <Link href="/me" className={styles.back}>
        ← 마이페이지
      </Link>
      <h1 className={styles.title}>초상 검수</h1>
      <p className={styles.description}>
        자동 검수가 확신하지 못했거나(실존 인물 사진·혐오 상징 가능성 등) 자동 검수를 하지 못한 초상입니다. 승인하기 전에는
        다른 사람에게 초상 없이 보입니다. 반려 사유는 만든 사람이 공방에서 봅니다.
      </p>
      {pending ? (
        <PortraitBoard pending={pending} />
      ) : (
        <p className={styles.error}>목록을 불러오지 못했습니다. apps/api가 켜져 있는지 확인하세요.</p>
      )}
    </section>
  );
}
