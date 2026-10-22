import Link from "next/link";
import CharacterAvatar from "@/components/character-avatar";
import { requireUser } from "@/lib/auth";
import { getMyConversations } from "@/lib/conversations";
import styles from "./page.module.css";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "방금";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffMinutes < 60 * 24) return `${Math.round(diffMinutes / 60)}시간 전`;
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export default async function LibraryPage() {
  await requireUser("/library");
  const conversations = await getMyConversations();

  return (
    <>
      <h1 className={styles.title}>대화 목록</h1>
      <p className={styles.description}>
        캐릭터마다 지금 대화가 이어서 기록됩니다. 저장한 대화는 대화 화면의 &quot;이어하기&quot;에서 다시 열 수 있어요.
      </p>

      {conversations === null && (
        <p className={styles.notice}>대화 목록을 불러오지 못했습니다. apps/api가 켜져 있는지 확인하세요.</p>
      )}

      {conversations?.length === 0 && (
        <div className={styles.empty}>
          <p>아직 대화한 캐릭터가 없습니다.</p>
          <Link href="/" className={styles.emptyLink}>
            캐릭터 고르러 가기
          </Link>
        </div>
      )}

      {conversations && conversations.length > 0 && (
        <ul className={styles.list}>
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/characters/${c.character.id}/chat`} className={styles.card}>
                <CharacterAvatar
                  characterId={c.character.id}
                  name={c.character.name}
                  hasPortrait={!!c.character.portraitMime}
                  version={c.character.updatedAt}
                />
                <div className={styles.cardBody}>
                <div className={styles.cardHead}>
                  <span className={styles.name}>{c.character.name}</span>
                  <span className={styles.when}>{formatWhen(c.updatedAt)}</span>
                </div>
                <p className={styles.preview}>
                  {c.lastMessage
                    ? `${c.lastMessage.role === "user" ? `${c.lastMessage.speaker ?? "나"}: ` : ""}${c.lastMessage.text}`
                    : c.character.oneLiner}
                </p>
                <span className={styles.count}>
                  {c.active ? `메시지 ${c.messageCount}개` : "지금 대화 없음"}
                  {c.savedCount > 0 && ` · 저장한 대화 ${c.savedCount}개`}
                </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
