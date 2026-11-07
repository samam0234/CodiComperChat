import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getCurrentUser } from "@/lib/auth";
import { getThemeState } from "@/lib/theme";
import "./globals.css";

// 서버 액션·페이지가 AI 답을 기다리는 최대 시간(초). 느린 모델(gemma4:12b)의 긴 답이 배포 플랫폼(Vercel)의 함수 시간 제한에
// 먼저 잘리지 않게 한다. Vercel 무료(Hobby)의 상한이 300초다. API의 AI_TIMEOUT_MS(기본 280초)가 이보다 짧아야 안내 문구가 나간다
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "코디컴퍼챗",
  description: "캐릭터 캠페인 동행 플랫폼",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, theme] = await Promise.all([getCurrentUser(), getThemeState()]);

  return (
    // data-scroll-behavior: 화면을 옮길 때는 Next가 부드러운 스크롤을 잠시 꺼 바로 맨 위로 간다 (globals.css의 scroll-behavior: smooth)
    // data-theme: 설정 기본값(자동 시간표·밝기 영구·다크 영구)과 헤더에서 잠깐 바꾼 것을 합친 지금 밝기 (lib/theme-schedule.ts)
    <html lang="ko" data-theme={theme.shade} data-scroll-behavior="smooth">
      <body>
        <SiteHeader viewer={user ? { displayName: user.displayName } : null} theme={theme} />
        <main className="mainArea">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
