import type { Metadata } from "next";
import LegalDoc from "@/components/legal-doc";

export const metadata: Metadata = { title: "사업자 정보 · 코디컴퍼챗" };

export default function BusinessPage() {
  return (
    <LegalDoc
      title="사업자 정보"
      updated="2026-10-15"
      draft
      intro={<p>전자상거래 등에서 소비자 보호에 관한 법률에 따라 표시하는 정보입니다. 사업자 등록을 마치면 운영자가 아래 칸을 채웁니다.</p>}
      sections={[
        {
          title: "사업자 정보",
          body: (
            <table>
              <tbody>
                <tr><th>상호</th><td><mark>[상호]</mark></td></tr>
                <tr><th>대표자</th><td><mark>[대표자 이름]</mark></td></tr>
                <tr><th>사업자등록번호</th><td><mark>[000-00-00000]</mark></td></tr>
                <tr><th>통신판매업 신고번호</th><td><mark>[제0000-지역-0000호]</mark></td></tr>
                <tr><th>주소</th><td><mark>[사업장 주소]</mark></td></tr>
                <tr><th>고객센터</th><td><mark>[이메일·전화]</mark></td></tr>
                <tr><th>호스팅 제공</th><td><mark>[호스팅 업체]</mark></td></tr>
              </tbody>
            </table>
          ),
        },
      ]}
    />
  );
}
