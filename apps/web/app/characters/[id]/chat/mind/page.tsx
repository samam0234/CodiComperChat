import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMind } from "@/lib/operations";
import sub from "../subpage.module.css";
import MindPanel from "./mind-panel";

export const metadata: Metadata = { title: "심리 탐구 · 코디컴퍼챗" };

export default async function MindPage({ params }: PageProps<"/characters/[id]/chat/mind">) {
  const { id } = await params;
  await requireUser(`/characters/${id}/chat/mind`);
  const data = await getMind(id);
  if (!data) notFound();

  return (
    <section>
      <Link href={`/characters/${id}/chat`} className={sub.back}>
        ← {data.character.name}와 대화로
      </Link>
      <MindPanel data={data} />
    </section>
  );
}
