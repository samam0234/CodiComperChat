import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import styles from "@/components/form.module.css";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "로그인 · 코디컴퍼챗" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>로그인</h1>
      <p className={styles.subtitle}>
        대화 목록, 제작, 마이페이지는 로그인한 뒤에 쓸 수 있습니다.
      </p>
      <LoginForm next={next} />
    </section>
  );
}
