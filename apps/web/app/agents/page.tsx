import PagePlaceholder from "@/components/page-placeholder";

export default function AgentsPage() {
  return (
    <PagePlaceholder
      title="에이전트"
      description="AI 챗봇 사용을 돕는 가이드와 프롬프트 추천이 놓일 자리입니다."
      items={[
        "AI 챗봇 사용 가이드 (처음 쓰는 사람용 안내)",
        "상황별 프롬프트 추천",
        "자주 묻는 질문",
      ]}
    />
  );
}
