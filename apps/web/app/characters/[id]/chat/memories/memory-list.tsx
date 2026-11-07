"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { createMemory, deleteMemory, refreshMemories } from "@/app/actions/memories";
import form from "@/components/form.module.css";
import { josa } from "@/lib/korean-josa";
import { formatDay } from "@/lib/format-time";
import styles from "../subpage.module.css";

type Memory = { id: string; content: string; pinned?: boolean; createdAt: string };

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
        <span>{memory.pinned ? "직접 적음" : "자동"} · {formatDay(memory.createdAt)}</span>
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
  const [writeState, write, writing] = useActionState(createMemory, undefined);

  return (
    <>
      {started && (
        <form action={write} className={styles.writer}>
          <label className={styles.writerLabel} htmlFor="memory-note">
            직접 기억 적기
          </label>
          <textarea
            id="memory-note"
            name="content"
            className={styles.writerInput}
            rows={3}
            maxLength={200}
            required
            placeholder="이 대화에서 오래 기억할 사실을 적어 주세요. 매 턴 불러 오되, 상황이 맞을 때만 말합니다."
          />
          <input type="hidden" name="characterId" value={characterId} />
          <button type="submit" className={form.secondary} disabled={writing}>
            {writing ? "적는 중…" : "기억에 남기기"}
          </button>
          <Status state={writeState} />
        </form>
      )}
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
            ? `아직 ${josa(characterName, "이/가")} 기억하는 내용이 없습니다. 위에서 직접 적거나, 대화가 쌓이면 자동으로 정리됩니다.`
            : `${josa(characterName, "과/와")} 대화를 시작하면 기억이 쌓이기 시작합니다.`}
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
