"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRecommendedPersona } from "@/app/actions/personas";
import form from "@/components/form.module.css";
import styles from "./recommended-persona.module.css";

const NAME_MAX = 20;
const DESCRIPTION_MAX = 300;

export type RecommendedPersonaInfo = { name: string; description: string };

// 이 캐릭터와 대화할 때 추천하는 내 프로필(선택). 그대로 쓰거나, 이름·소개를 고쳐서 내 프로필로 만든 뒤 바로 고른다.
// 같은 이름의 프로필이 이미 있으면 새로 만들지 않고 그것을 고른다
export default function RecommendedPersona({
  persona,
  characterName,
  existing,
  onSelect,
}: {
  persona: RecommendedPersonaInfo;
  characterName: string;
  existing: { id: string; name: string }[];
  onSelect: (id: string) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(persona.name);
  const [description, setDescription] = useState(persona.description);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const same = existing.find((p) => p.name === persona.name);

  const use = (input: RecommendedPersonaInfo) =>
    startTransition(async () => {
      setError(null);
      const found = existing.find((p) => p.name === input.name.trim());
      if (found) {
        onSelect(found.id);
        return;
      }
      const result = await createRecommendedPersona({ name: input.name.trim(), description: input.description.trim() });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onSelect(result.id);
      setEditing(false);
    });

  return (
    <section className={styles.card} aria-label="추천 프로필">
      <div className={styles.head}>
        <span className={styles.badge}>추천 프로필</span>
        <span className={styles.hint}>{characterName} 전용 · 선택</span>
      </div>
      {!editing ? (
        <>
          <p className={styles.name}>{persona.name}</p>
          <p className={styles.description}>{persona.description}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => use(persona)} disabled={pending}>
              {same ? "이 프로필 고르기" : "이 프로필로 시작"}
            </button>
            <button type="button" className={styles.secondary} onClick={() => setEditing(true)} disabled={pending}>
              고쳐서 쓰기
            </button>
          </div>
        </>
      ) : (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            use({ name, description });
          }}
        >
          <label className={form.field}>
            <span className={form.label}>이름</span>
            <input className={form.input} value={name} maxLength={NAME_MAX} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className={form.field}>
            <span className={form.label}>소개</span>
            <textarea
              className={form.input}
              value={description}
              maxLength={DESCRIPTION_MAX}
              rows={4}
              onChange={(e) => setDescription(e.target.value)}
            />
            <span className={form.hint}>내 프로필로 저장돼요. 마이페이지에서 언제든 고칠 수 있어요.</span>
          </label>
          <div className={styles.actions}>
            <button type="submit" className={styles.primary} disabled={pending || name.trim() === ""}>
              {pending ? "만드는 중…" : "이대로 만들고 쓰기"}
            </button>
            <button type="button" className={styles.secondary} onClick={() => setEditing(false)} disabled={pending}>
              취소
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className={form.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
