import PagePlaceholder from "@/components/page-placeholder";

export default function MyPage() {
  return (
    <PagePlaceholder
      title="마이페이지"
      description="내 계정과 내 주인공 정보가 놓일 자리입니다."
      items={["프로필 / 주인공 호칭", "내가 만든 카드"]}
    />
  );
}
