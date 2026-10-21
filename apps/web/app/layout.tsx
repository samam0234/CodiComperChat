import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getCurrentUser } from "@/lib/auth";
import { getThemeState } from "@/lib/theme";
import "./globals.css";

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
