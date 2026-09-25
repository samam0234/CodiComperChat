import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import styles from "@/components/form.module.css";
import SignupForm from "./signup-form";

export const metadata: Metadata = { title: "회원가입 · 코디컴퍼챗" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>회원가입</h1>
      <p className={styles.subtitle}>이메일로 가입합니다.</p>
      <SignupForm next={next} />
    </section>
  );
}
