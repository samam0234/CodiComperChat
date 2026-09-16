import Link from "next/link";
import { notFound } from "next/navigation";
import CharacterChat from "./character-chat";
import styles from "./page.module.css";

type CharacterSummary = {
  id: string;
  name: string;
  oneLiner: string;
  openingScene: string;
};

async function getCharacter(id: string): Promise<CharacterSummary | null> {
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

  const res = await fetch(`${baseUrl}/characters/${id}`, { cache: "no-store" });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`캐릭터를 불러오지 못했습니다 (HTTP ${res.status})`);
  }

  return res.json();
}

export default async function CharacterChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const character = await getCharacter(id);

  if (!character) {
    notFound();
  }

  return (
    <section>
      <Link href={`/characters/${character.id}`} className={styles.back}>
        ← {character.name} 프로필로
      </Link>

      <h1 className={styles.title}>{character.name}</h1>
      <p className={styles.description}>{character.oneLiner}</p>

      <CharacterChat
        characterId={character.id}
        characterName={character.name}
        openingScene={character.openingScene}
      />
    </section>
  );
}
