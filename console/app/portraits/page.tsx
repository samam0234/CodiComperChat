import type { Metadata } from "next";
import PageHead from "@/components/page-head";
import { adminGet, requireAdmin } from "@/lib/api";
import type { PendingPortrait } from "@/lib/types";
import PortraitBoard from "./portrait-board";
import styles from "./portrait-board.module.css";

export const metadata: Metadata = { title: "초상 검수 · 운영 콘솔" };

export default async function PortraitsPage() {
  await requireAdmin("/portraits");
  const pending = await adminGet<PendingPortrait[]>("/admin/portraits");

  return (
    <>
      <PageHead
        title="초상 검수"
        description="자동 검수가 확신하지 못했거나(실존 인물 사진·혐오 상징 가능성 등) 자동 검수를 하지 못한 초상입니다. 승인하기 전에는 다른 사람에게 초상 없이 보입니다. 반려 사유는 만든 사람이 공방에서 봅니다."
      />
      {pending ? <PortraitBoard pending={pending} /> : <p className={styles.error}>목록을 불러오지 못했습니다. apps/api가 켜져 있는지 확인하세요.</p>}
    </>
  );
}
