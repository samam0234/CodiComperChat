import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMemories } from "@/lib/conversations";
import styles from "../subpage.module.css";
import MemoryList from "./memory-list";

export const metadata: Metadata = { title: "메모리 기록 · 코디컴퍼챗" };

export default async function MemoriesPage({ params }: PageProps<"/characters/[id]/chat/memories">) {
  const { id } = await params;
  await requireUser(`/characters/${id}/chat/memories`);
  const data = await getMemories(id);
  if (!data) notFound();

  return (
    <section>
      <Link href={`/characters/${id}/chat`} className={styles.back}>
        ← {data.character.name}와 대화로
      </Link>
      <h1 className={styles.title}>메모리 기록</h1>
      <p className={styles.description}>
        {data.character.name}가 지난 대화에서 기억해 둔 내용입니다. 다음 대화에서 관련 있는 기억을 꺼내
        씁니다. 틀린 기억은 지우면 더 이상 쓰지 않습니다.
      </p>
      <MemoryList
        characterId={id}
        characterName={data.character.name}
        memories={data.memories}
        started={data.started}
      />
    </section>
  );
}
