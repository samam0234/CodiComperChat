import PagePlaceholder from "@/components/page-placeholder";

export default function PopularPage() {
  return (
    <PagePlaceholder
      title="인기"
      description="많이 플레이된 캐릭터와 캠페인을 모아 보는 자리입니다."
      items={["인기 캐릭터 목록", "인기 캠페인 목록"]}
    />
  );
}
