import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getChatState } from "@/lib/conversations";
import styles from "../subpage.module.css";
import StateForm from "./state-form";

export const metadata: Metadata = { title: "캐릭터 상태설정 · 코디컴퍼챗" };

export default async function ChatSettingsPage({ params }: PageProps<"/characters/[id]/chat/settings">) {
  const { id } = await params;
  await requireUser(`/characters/${id}/chat/settings`);
  const data = await getChatState(id);
  if (!data) notFound();

  return (
    <section>
      <Link href={`/characters/${id}/chat`} className={styles.back}>
        ← {data.character.name}와 대화로
      </Link>
      <h1 className={styles.title}>캐릭터 상태설정</h1>
      <p className={styles.description}>
        {data.character.name}와 나 사이의 관계와 호칭을 정합니다. 이 캐릭터와의 대화에만 적용됩니다.
      </p>
      <div className={styles.formWrap}>
        <StateForm
          characterId={id}
          characterName={data.character.name}
          addressing={data.character.addressing}
          initial={data.state}
        />
      </div>
    </section>
  );
}
