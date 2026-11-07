import type { Metadata } from "next";
import { getAdmin } from "@/lib/api";
import Sidebar from "@/components/sidebar";
import "./globals.css";
import styles from "./layout.module.css";

// 서버 액션·페이지가 AI 답을 기다리는 최대 시간(초). 느린 모델(gemma4:12b)의 긴 답이 배포 플랫폼(Vercel)의 함수 시간 제한에
// 먼저 잘리지 않게 한다. Vercel 무료(Hobby)의 상한이 300초다. API의 AI_TIMEOUT_MS(기본 280초)가 이보다 짧아야 안내 문구가 나간다
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "운영 콘솔 · 코디컴퍼챗",
  description: "코디컴퍼챗 운영자 전용",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const admin = await getAdmin();

  return (
    <html lang="ko">
      <body>
        {admin ? (
          <div className={styles.shell}>
            <Sidebar admin={{ displayName: admin.displayName, email: admin.email }} />
            <main className={styles.main}>{children}</main>
          </div>
        ) : (
          <main className={styles.bare}>{children}</main>
        )}
      </body>
    </html>
  );
}
