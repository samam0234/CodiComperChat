import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BrandMark from "@/components/brand-mark";
import form from "@/components/form.module.css";
import { getAdmin, safeNextPath } from "@/lib/api";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "로그인 · 운영 콘솔" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNextPath((await searchParams).next);
  if (await getAdmin()) redirect(next);

  return (
    <section className={form.card}>
      <BrandMark size={36} id="login-brand" />
      <h1 className={form.title} style={{ marginTop: 12 }}>
        운영 콘솔
      </h1>
      <p className={form.subtitle}>운영자 계정으로만 들어올 수 있습니다. 이용자 사이트와 같은 이메일·비밀번호를 씁니다.</p>
      <LoginForm next={next} />
    </section>
  );
}
