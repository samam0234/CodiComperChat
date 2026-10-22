import type { Metadata } from "next";
import PageHead from "@/components/page-head";
import { WEB_BASE_URL, adminGet, requireAdmin } from "@/lib/api";
import type { AdminReportsView } from "@/lib/reports";
import ReportsBoard from "./reports-board";
import styles from "./reports-board.module.css";

export const metadata: Metadata = { title: "신고함 · 운영 콘솔" };

export default async function ReportsPage() {
  await requireAdmin("/reports");
  const view = await adminGet<AdminReportsView>("/admin/reports");

  return (
    <>
      <PageHead
        title="신고함"
        description="공개·링크 공개 캐릭터에 들어온 신고입니다. 내리면 목록·상세·대화 어디에도 나오지 않고, 만든 사람은 공방에서 사유를 봅니다. 신고가 많은 캐릭터가 위에 나옵니다."
      />
      {view ? (
        <ReportsBoard open={view.open} takenDown={view.takenDown} webBaseUrl={WEB_BASE_URL} />
      ) : (
        <p className={styles.error}>신고함을 불러오지 못했습니다. apps/api가 켜져 있는지 확인하세요.</p>
      )}
    </>
  );
}
