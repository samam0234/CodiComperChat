import type { Metadata } from "next";
import PageHead from "@/components/page-head";
import { requireAdmin } from "@/lib/api";
import PlanTool from "./plan-tool";

export const metadata: Metadata = { title: "계정 등급 · 운영 콘솔" };

export default async function UsersPage() {
  await requireAdmin("/users");

  return (
    <>
      <PageHead
        title="계정 등급"
        description="이메일로 계정을 찾아 요금 등급을 직접 바꿉니다. 보상·시험 계정용이며 결제 기록은 바뀌지 않습니다. 일수를 비우면 만료 없는 프로입니다."
      />
      <PlanTool />
    </>
  );
}
