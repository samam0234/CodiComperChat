import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSavedConversations } from "@/lib/conversations";
import styles from "../subpage.module.css";
import SavedList from "./saved-list";

export const metadata: Metadata = { title: "이어하기 · 코디컴퍼챗" };

export default async function SavedConversationsPage({ params }: PageProps<"/characters/[id]/chat/saved">) {
  const { id } = await params;
  await requireUser(`/characters/${id}/chat/saved`);
  const data = await getSavedConversations(id);
  if (!data) notFound();

  return (
    <section>
      <Link href={`/characters/${id}/chat`} className={styles.back}>
        ← {data.character.name}와 대화로
      </Link>
      <h1 className={styles.title}>이어하기</h1>
      <p className={styles.description}>
        {data.character.name}와 저장한 대화입니다. 고르면 그 대화의 내용·기억·상태설정 그대로 이어서 시작합니다.
      </p>
      <SavedList characterId={id} currentHasMessages={data.currentHasMessages} saved={data.saved} />
    </section>
  );
}
