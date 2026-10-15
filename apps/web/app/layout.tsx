import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getCurrentUser } from "@/lib/auth";
import { getTheme } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "코디컴퍼챗",
  description: "캐릭터 캠페인 동행 플랫폼",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, theme] = await Promise.all([getCurrentUser(), getTheme()]);

  return (
    // data-scroll-behavior: 화면을 옮길 때는 Next가 부드러운 스크롤을 잠시 꺼 바로 맨 위로 간다 (globals.css의 scroll-behavior: smooth)
    <html lang="ko" data-theme={theme === "system" ? undefined : theme} data-scroll-behavior="smooth">
      <body>
        <SiteHeader viewer={user ? { displayName: user.displayName } : null} />
        <main className="mainArea">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
