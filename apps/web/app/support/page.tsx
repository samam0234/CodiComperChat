import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc from "@/components/legal-doc";

export const metadata: Metadata = { title: "고객센터 · 코디컴퍼챗" };

export default function SupportPage() {
  return (
    <LegalDoc
      title="고객센터"
      updated="2026-10-15"
      draft
      sections={[
        {
          title: "문의하기",
          body: (
            <ul>
              <li>이메일: <mark>[운영자 이메일]</mark></li>
              <li>운영 시간: <mark>[예: 평일 10:00–18:00]</mark> · 답변은 영업일 기준 <mark>[예: 3일]</mark> 안에 드립니다.</li>
              <li>문의할 때 가입한 이메일과 어떤 화면에서 무슨 일이 있었는지 적어 주시면 빨리 확인할 수 있습니다. 비밀번호는 절대 보내지 마세요.</li>
            </ul>
          ),
        },
        {
          title: "자주 묻는 것",
          body: (
            <>
              <p><strong>캐릭터가 설정과 다르게 말해요.</strong></p>
              <p>AI의 답은 매번 달라져 가끔 설정과 어긋날 수 있습니다. 공방에서 말투 샘플과 테스트 3턴으로 미리 확인할 수 있고, 대화 중 이상한 기억은 ⋮ 메뉴의 &quot;메모리 기록 확인&quot;에서 지울 수 있어요.</p>
              <p><strong>요청이 너무 많다고 나와요.</strong></p>
              <p>AI를 부르는 기능(대화·대답 추천·공방의 샘플·초안·판정)은 한 번에 많이 쓰지 못하게 횟수를 제한합니다. 안내된 시간 뒤에 다시 시도해 주세요.</p>
              <p><strong>비밀번호를 잊었어요.</strong></p>
              <p>비밀번호 찾기는 아직 준비 중입니다. 위 이메일로 가입한 주소와 함께 문의해 주세요.</p>
              <p><strong>계정을 지우고 싶어요.</strong></p>
              <p>회원 탈퇴 기능은 준비 중입니다. 문의해 주시면 계정과 관련 정보를 삭제해 드립니다. <Link href="/privacy">개인정보처리방침</Link>도 참고하세요.</p>
              <p><strong>부적절한 캐릭터를 봤어요.</strong></p>
              <p>캐릭터 상세 화면 맨 아래 &quot;신고하기&quot;로 알려 주세요. 운영자가 확인해 내릴 수 있습니다.</p>
              <p><strong>내 캐릭터가 운영자에 의해 내려갔어요.</strong></p>
              <p>공방의 캐릭터 화면에 내린 사유가 나옵니다. 이의가 있으면 캐릭터 이름과 함께 문의해 주세요.</p>
            </>
          ),
        },
        {
          title: "긴급한 도움이 필요할 때",
          body: (
            <p>
              힘들거나 위험한 상황이라면 AI 캐릭터가 아니라 가까운 사람이나 전문 기관에 연락하세요. 국내에서는 자살예방상담전화 109, 긴급 상황은 112·119입니다.
            </p>
          ),
        },
      ]}
    />
  );
}
