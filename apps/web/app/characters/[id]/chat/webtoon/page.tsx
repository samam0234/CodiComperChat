import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getWebtoons } from "@/lib/operations";
import sub from "../subpage.module.css";
import WebtoonPanel from "./webtoon-panel";

export const metadata: Metadata = { title: "웹툰 · 코디컴퍼챗" };

export default async function WebtoonPage({ params }: PageProps<"/characters/[id]/chat/webtoon">) {
  const { id } = await params;
  await requireUser(`/characters/${id}/chat/webtoon`);
  const data = await getWebtoons(id);
  if (!data) notFound();

  return (
    <section>
      <Link href={`/characters/${id}/chat`} className={sub.back}>
        ← {data.character.name}와 대화로
      </Link>
      <WebtoonPanel data={data} />
    </section>
  );
}
