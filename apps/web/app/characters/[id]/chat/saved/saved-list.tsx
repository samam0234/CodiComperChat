"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSavedConversation, resumeConversation } from "@/app/actions/conversations";
import ChoiceDialog from "@/components/choice-dialog";
import type { SavedConversation } from "@/lib/conversations";
import styles from "./saved-list.module.css";

function formatWhen(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function SavedList({
  characterId,
  currentHasMessages,
  saved,
}: {
  characterId: string;
  currentHasMessages: boolean;
  saved: SavedConversation[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(saved);
  // 이어할 대화를 골랐고, 지금 대화를 저장할지 묻는 중
  const [pending, setPending] = useState<SavedConversation | null>(null);
  const [deleting, setDeleting] = useState<SavedConversation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resume = async (target: SavedConversation, saveCurrent: boolean) => {
    setBusy(true);
    setError(null);
    const result = await resumeConversation(characterId, target.id, saveCurrent);
    if (!result.ok) {
      setBusy(false);
      setPending(null);
      setError(result.error);
      return;
    }
    router.push(`/characters/${characterId}/chat`);
    router.refresh();
  };

  // 지금 대화에 나눈 말이 있으면 저장할지 먼저 묻는다
  const pick = (target: SavedConversation) => {
    if (currentHasMessages) setPending(target);
    else void resume(target, false);
  };

  const remove = async (target: SavedConversation) => {
    setBusy(true);
    setError(null);
    const result = await deleteSavedConversation(characterId, target.id);
    setBusy(false);
    setDeleting(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((prev) => prev.filter((c) => c.id !== target.id));
  };

  return (
    <>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>저장한 대화가 없습니다.</p>
          <p className={styles.emptyHint}>
            대화 중 &quot;새로하기&quot;에서 &quot;저장하겠습니다&quot;를 누르면 여기에 남아요.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((c) => (
            <li key={c.id} className={styles.item}>
              <button type="button" className={styles.card} onClick={() => pick(c)} disabled={busy}>
                <span className={styles.head}>
                  <span className={styles.title}>{c.title}</span>
                  <span className={styles.when}>{formatWhen(c.savedAt ?? c.updatedAt)}</span>
                </span>
                {c.lastMessage && (
                  <span className={styles.preview}>
                    {c.lastMessage.role === "user" ? `${c.lastMessage.speaker ?? "나"}: ` : ""}
                    {c.lastMessage.text}
                  </span>
                )}
                <span className={styles.meta}>
                  {c.personaName && <span>내 프로필 {c.personaName}</span>}
                  <span>메시지 {c.messageCount}개</span>
                  {c.memoryCount > 0 && <span>기억 {c.memoryCount}개</span>}
                </span>
                <span className={styles.resume}>이어하기 →</span>
              </button>
              <button
                type="button"
                className={styles.delete}
                onClick={() => setDeleting(c)}
                disabled={busy}
                aria-label={`${c.title} 대화 지우기`}
              >
                지우기
              </button>
            </li>
          ))}
        </ul>
      )}

      <ChoiceDialog
        open={pending !== null}
        title="지금 대화를 저장하시겠습니까?"
        onClose={() => setPending(null)}
        busy={busy}
        choices={[
          { label: "취소", onSelect: () => setPending(null) },
          { label: "저장 안 함", tone: "danger", onSelect: () => pending && void resume(pending, false) },
          { label: "저장하겠습니다", tone: "primary", onSelect: () => pending && void resume(pending, true) },
        ]}
      >
        고른 대화로 이어 가기 전에, 지금 하던 대화를 저장할지 정해 주세요. 저장하지 않으면 지금 대화는 지워집니다.
      </ChoiceDialog>

      <ChoiceDialog
        open={deleting !== null}
        title="저장한 대화를 지울까요?"
        onClose={() => setDeleting(null)}
        busy={busy}
        choices={[
          { label: "취소", onSelect: () => setDeleting(null) },
          { label: "지우기", tone: "danger", onSelect: () => deleting && void remove(deleting) },
        ]}
      >
        대화 내용과 그 대화의 기억·상태설정이 함께 지워지며 되돌릴 수 없습니다.
      </ChoiceDialog>
    </>
  );
}
