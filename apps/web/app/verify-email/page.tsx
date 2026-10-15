import type { Metadata } from "next";
import styles from "@/components/form.module.css";
import VerifyForm from "./verify-form";

export const metadata: Metadata = { title: "이메일 인증 · 코디컴퍼챗" };

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>이메일 인증</h1>
      {typeof token === "string" && token ? (
        <>
          <p className={styles.subtitle}>아래 버튼을 누르면 인증이 끝나요.</p>
          <VerifyForm token={token} />
        </>
      ) : (
        <p className={styles.subtitle}>링크가 올바르지 않아요. 마이페이지에서 인증 메일을 다시 받아 주세요.</p>
      )}
    </section>
  );
}
