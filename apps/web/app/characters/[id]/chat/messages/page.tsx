import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMessages } from "@/lib/operations";
import sub from "../subpage.module.css";
import Messenger from "./messenger";

export const metadata: Metadata = { title: "메시지 · 코디컴퍼챗" };

export default async function MessagesPage({ params }: PageProps<"/characters/[id]/chat/messages">) {
  const { id } = await params;
  await requireUser(`/characters/${id}/chat/messages`);
  const data = await getMessages(id);
  if (!data) notFound();

  return (
    <section>
      <Link href={`/characters/${id}/chat`} className={sub.back}>
        ← {data.character.name}와 대화로
      </Link>
      <Messenger data={data} />
    </section>
  );
}
