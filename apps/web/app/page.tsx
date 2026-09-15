import PagePlaceholder from "@/components/page-placeholder";

export default function HomePage() {
  return (
    <PagePlaceholder
      title="홈"
      description="진행 중인 캠페인과 시작할 캐릭터가 놓일 자리입니다."
      items={[
        "진행 중인 캠페인 카드 (지난 세션에서 남은 것 한 줄)",
        "캐릭터 선택 영역",
      ]}
    />
  );
}
