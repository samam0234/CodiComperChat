import PagePlaceholder from "@/components/page-placeholder";

export default function AgentsPage() {
  return (
    <PagePlaceholder
      title="에이전트"
      description="동행할 캐릭터(캠페니언)를 찾아보는 자리입니다."
      items={["공식 캐릭터 목록", "역할별 필터 (동료 / 라이벌 / 의뢰인 / 가이드)"]}
    />
  );
}
