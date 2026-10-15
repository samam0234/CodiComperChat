import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/form.module.css";
import ResetForm from "./reset-form";

export const metadata: Metadata = { title: "비밀번호 재설정 · 코디컴퍼챗" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>새 비밀번호 정하기</h1>
      {typeof token === "string" && token ? (
        <>
          <p className={styles.subtitle}>바꾸면 모든 기기에서 로그아웃되고, 새 비밀번호로 다시 로그인해요.</p>
          <ResetForm token={token} />
        </>
      ) : (
        <p className={styles.subtitle}>
          링크가 올바르지 않아요. 메일의 링크를 다시 열거나 <Link href="/forgot-password">비밀번호 찾기</Link>를 다시
          해 주세요.
        </p>
      )}
    </section>
  );
}
