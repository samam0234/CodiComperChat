import type { Metadata } from "next";
import styles from "@/components/form.module.css";
import ForgotForm from "./forgot-form";

export const metadata: Metadata = { title: "비밀번호 찾기 · 코디컴퍼챗" };

export default function ForgotPasswordPage() {
  return (
    <section className={styles.card}>
      <h1 className={styles.title}>비밀번호 찾기</h1>
      <p className={styles.subtitle}>가입한 이메일을 적으면 비밀번호를 새로 정할 수 있는 링크를 보내 드려요.</p>
      <ForgotForm />
    </section>
  );
}
