"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { deleteMemory, refreshMemories } from "@/app/actions/memories";
import form from "@/components/form.module.css";
import styles from "../subpage.module.css";

type Memory = { id: string; content: string; createdAt: string };

function Status({ state }: { state: FormState }) {
  if (state?.error) return <p className={form.error} role="alert">{state.error}</p>;
  if (state?.success) return <p className={form.success} role="status">{state.success}</p>;
  return null;
}

function MemoryItem({ characterId, memory }: { characterId: string; memory: Memory }) {
  const [state, action, pending] = useActionState(deleteMemory, undefined);
  return (
    <li className={styles.memory}>
      <p className={styles.memoryText}>{memory.content}</p>
      <div className={styles.memoryMeta}>
        <span>{new Date(memory.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}</span>
        <form action={action}>
          <input type="hidden" name="characterId" value={characterId} />
          <input type="hidden" name="memoryId" value={memory.id} />
          <button type="submit" className={styles.delete} disabled={pending} aria-label={`기억 지우기: ${memory.content}`}>
            지우기
          </button>
        </form>
      </div>
      <Status state={state} />
    </li>
  );
}

export default function MemoryList({
  characterId,
  characterName,
  memories,
  started,
}: {
  characterId: string;
  characterName: string;
  memories: Memory[];
  started: boolean;
}) {
  const [state, action, pending] = useActionState(refreshMemories, undefined);

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.count}>기억 {memories.length}개</span>
        {started && (
          <form action={action}>
            <input type="hidden" name="characterId" value={characterId} />
            <button type="submit" className={form.secondary} disabled={pending}>
              {pending ? "정리하는 중…" : "지금 정리하기"}
            </button>
          </form>
        )}
      </div>
      <Status state={state} />

      {memories.length === 0 ? (
        <p className={styles.empty}>
          {started
            ? `아직 ${characterName}가 기억하는 내용이 없습니다. 대화가 3번 오갈 때마다 자동으로 정리되고, "지금 정리하기"로 바로 정리할 수도 있어요.`
            : `${characterName}와 대화를 시작하면 기억이 쌓이기 시작합니다.`}
        </p>
      ) : (
        <ul className={styles.memories}>
          {memories.map((memory) => (
            <MemoryItem key={memory.id} characterId={characterId} memory={memory} />
          ))}
        </ul>
      )}
    </>
  );
}
