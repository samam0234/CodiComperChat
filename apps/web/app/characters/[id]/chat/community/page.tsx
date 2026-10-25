import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getBoard } from "@/lib/operations";
import sub from "../subpage.module.css";
import Community from "./community";

export const metadata: Metadata = { title: "커뮤니티 · 코디컴퍼챗" };

export default async function CommunityPage({ params }: PageProps<"/characters/[id]/chat/community">) {
  const { id } = await params;
  await requireUser(`/characters/${id}/chat/community`);
  const data = await getBoard(id);
  if (!data) notFound();

  return (
    <section>
      <Link href={`/characters/${id}/chat`} className={sub.back}>
        ← {data.character.name}와 대화로
      </Link>
      <Community data={data} />
    </section>
  );
}
