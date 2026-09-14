import PagePlaceholder from "@/components/page-placeholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="설정"
      description="계정, 수위, 알림 설정이 놓일 자리입니다."
      items={["계정", "컨텐츠 수위", "알림"]}
    />
  );
}
