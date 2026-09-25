import PagePlaceholder from "@/components/page-placeholder";
import { requireUser } from "@/lib/auth";

export default async function StudioPage() {
  await requireUser("/studio");

  return (
    <PagePlaceholder
      title="제작"
      description="캐릭터 공방이 놓일 자리입니다. v1에서는 운영자부터 사용합니다."
      items={[
        "7단계 폼 (정체성 / 외형 / 성격·말투 / 캠페인 역할 / 비밀·경계 / 첫인사 / 로어북)",
        "라이브 프리뷰와 테스트 3턴",
      ]}
    />
  );
}
