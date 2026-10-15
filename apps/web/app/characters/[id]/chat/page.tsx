import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionToken, requireUser } from "@/lib/auth";
import { getChatHistory } from "@/lib/conversations";
import { getMyPersonas } from "@/lib/personas";
import CharacterAvatar from "@/components/character-avatar";
import CharacterChat from "./character-chat";
import styles from "./page.module.css";

type CharacterSummary = {
  id: string;
  name: string;
  oneLiner: string;
  openingScene: string;
  portraitMime?: string | null;
  updatedAt?: string;
};

async function getCharacter(id: string): Promise<CharacterSummary | null> {
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

  // 로그인했으면 토큰을 붙인다 — 내 비공개 캐릭터는 만든 사람에게만 보인다
  const token = await getSessionToken();
  const res = await fetch(`${baseUrl}/characters/${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
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
  // 대화는 내 프로필 캐릭터로만 할 수 있고, 프로필은 로그인 유저의 것이다
  await requireUser(`/characters/${id}/chat`);
  const [character, personas, history] = await Promise.all([
    getCharacter(id),
    getMyPersonas(),
    getChatHistory(id),
  ]);

  if (!character) {
    notFound();
  }

  const initialMessages = history?.messages ?? [
    { id: "opening", role: "character" as const, text: character.openingScene, speaker: null },
  ];

  return (
    <section>
      <Link href={`/characters/${character.id}`} className={styles.back}>
        ← {character.name} 프로필로
      </Link>

      <div className={styles.titleRow}>
        <CharacterAvatar characterId={character.id} name={character.name} hasPortrait={!!character.portraitMime} version={character.updatedAt} />
        <h1 className={styles.title}>{character.name}</h1>
      </div>
      <p className={styles.description}>{character.oneLiner}</p>

      <CharacterChat
        characterId={character.id}
        characterName={character.name}
        initialMessages={initialMessages}
        lockedPersona={history?.persona ?? null}
        savedCount={history?.savedCount ?? 0}
        personas={personas.map(({ id: personaId, name }) => ({ id: personaId, name }))}
      />
    </section>
  );
}
