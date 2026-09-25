import PagePlaceholder from "@/components/page-placeholder";
import { requireUser } from "@/lib/auth";

export default async function LibraryPage() {
  await requireUser("/library");

  return (
    <PagePlaceholder
      title="대화 목록 (라이브러리)"
      description="내 캠페인과 회차 기록이 쌓이는 자리입니다."
      items={["진행 중인 캠페인", "세션 로그북 (회차 목록)"]}
    />
  );
}
