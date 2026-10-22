import type { Metadata } from "next";
import { getAdmin } from "@/lib/api";
import Sidebar from "@/components/sidebar";
import "./globals.css";
import styles from "./layout.module.css";

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
