import type { Metadata } from "next";
import PageHead from "@/components/page-head";
import { adminGet, requireAdmin } from "@/lib/api";
import type { ContentReportsView } from "@/lib/content-reports";
import ContentBoard from "./content-board";
import styles from "./content-board.module.css";

export const metadata: Metadata = { title: "그림 신고 · 운영 콘솔" };

export default async function ContentReportsPage() {
  await requireAdmin("/content");
  const view = await adminGet<ContentReportsView>("/admin/content-reports");

  return (
    <>
      <PageHead
        title="그림 신고"
        description="코디포토넷·웹툰을 만든 사람이 올린 신고입니다. 접근을 막으면 그 사람에게도 그림이 보이지 않습니다. 계정 정지는 로그인과 API를 막습니다."
      />
      {view ? (
        <ContentBoard open={view.open} blocked={view.blocked} reasons={view.reasons} />
      ) : (
        <p className={styles.error}>그림 신고를 불러오지 못했습니다. apps/api가 켜져 있는지 확인하세요.</p>
      )}
    </>
  );
}
