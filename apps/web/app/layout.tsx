import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "코디컴퍼챗",
  description: "캐릭터 캠페인 동행 플랫폼",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        <main className="mainArea">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
