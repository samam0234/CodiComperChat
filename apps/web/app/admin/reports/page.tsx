import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminReports } from "@/lib/admin";
import { requireUser } from "@/lib/auth";
import ReportsBoard from "./reports-board";
import styles from "./reports-board.module.css";

export const metadata: Metadata = { title: "신고함 · 코디컴퍼챗" };

export default async function AdminReportsPage() {
  const user = await requireUser("/admin/reports");
  // 운영자가 아니면 이 화면이 있는지도 모르게 404. 진짜 권한 확인은 Nest(AdminGuard)가 DB의 role로 한다
  if (user.role !== "ADMIN") notFound();
  const view = await getAdminReports();

  return (
    <section>
      <Link href="/me" className={styles.back}>
        ← 마이페이지
      </Link>
      <h1 className={styles.title}>신고함</h1>
      <p className={styles.description}>
        공개·링크 공개 캐릭터에 들어온 신고입니다. 내리면 목록·상세·대화 어디에도 나오지 않고, 만든 사람은 공방에서 사유를
        봅니다. 신고가 많은 캐릭터가 위에 나옵니다.
      </p>
      {view ? (
        <ReportsBoard open={view.open} takenDown={view.takenDown} />
      ) : (
        <p className={styles.error}>신고함을 불러오지 못했습니다. apps/api가 켜져 있는지 확인하세요.</p>
      )}
    </section>
  );
}
