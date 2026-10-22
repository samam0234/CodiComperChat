import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDiary } from "@/lib/operations";
import sub from "../subpage.module.css";
import DiaryPanel from "./diary-panel";

export const metadata: Metadata = { title: "일기 · 코디컴퍼챗" };

export default async function DiaryPage({ params }: PageProps<"/characters/[id]/chat/diary">) {
  const { id } = await params;
  await requireUser(`/characters/${id}/chat/diary`);
  const data = await getDiary(id);
  if (!data) notFound();

  return (
    <section>
      <Link href={`/characters/${id}/chat`} className={sub.back}>
        ← {data.character.name}와 대화로
      </Link>
      <DiaryPanel data={data} />
    </section>
  );
}
