"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { createPersona, deletePersona, updatePersona } from "@/app/actions/personas";
import form from "@/components/form.module.css";
import styles from "./personas.module.css";

type Persona = { id: string; name: string; description: string };

const NAME_MAX = 20;
const DESCRIPTION_MAX = 300;

function Status({ state }: { state: FormState }) {
  if (state?.error) return <p className={form.error} role="alert">{state.error}</p>;
  if (state?.success) return <p className={form.success} role="status">{state.success}</p>;
  return null;
}

function PersonaFields({ values }: { values?: { name?: string; description?: string } }) {
  return (
    <>
      <label className={form.field}>
        <span className={form.label}>이름</span>
        <input
          className={form.input}
          name="name"
          defaultValue={values?.name}
          maxLength={NAME_MAX}
          placeholder="예: 한서윤"
          required
        />
      </label>
      <label className={form.field}>
        <span className={form.label}>소개 (선택)</span>
        <textarea
          className={`${form.input} ${styles.textarea}`}
          name="description"
          defaultValue={values?.description}
          maxLength={DESCRIPTION_MAX}
          rows={3}
          placeholder="캐릭터가 알고 대해 줬으면 하는 내 주인공의 설정. 예: 고3 수험생, 말수가 적고 수학을 싫어함"
        />
      </label>
    </>
  );
}

function PersonaItem({ persona }: { persona: Persona }) {
  const [saveState, saveAction, saving] = useActionState(updatePersona, undefined);
  const [deleteState, deleteAction, deleting] = useActionState(deletePersona, undefined);

  return (
    <li className={styles.item}>
      <details>
        <summary className={styles.summary}>
          <span className={styles.name}>{persona.name}</span>
          <span className={styles.description}>
            {persona.description || "소개 없음"}
          </span>
          <span className={styles.edit}>수정</span>
        </summary>

        <form action={saveAction} className={`${form.form} ${styles.editForm}`}>
          <input type="hidden" name="id" value={persona.id} />
          <PersonaFields values={saveState?.values ?? persona} />
          <Status state={saveState} />
          <div className={styles.actions}>
            <button type="submit" className={form.secondary} disabled={saving}>
              저장
            </button>
          </div>
        </form>

        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!confirm(`'${persona.name}' 프로필 캐릭터를 삭제할까요?`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={persona.id} />
          <Status state={deleteState} />
          <button type="submit" className={styles.delete} disabled={deleting}>
            삭제
          </button>
        </form>
      </details>
    </li>
  );
}

export default function Personas({ personas, limit }: { personas: Persona[]; limit: number }) {
  const [state, action, pending] = useActionState(createPersona, undefined);
  const full = personas.length >= limit;

  return (
    <section className={styles.section} aria-labelledby="personas-heading">
      <h2 id="personas-heading" className={styles.heading}>
        내 프로필 캐릭터 <span className={styles.count}>{personas.length}/{limit}</span>
      </h2>
      <p className={styles.lead}>
        대화할 때 내가 연기할 주인공입니다. 채팅 입력창 아래에서 골라 쓸 수 있고, 나만 볼 수 있습니다.
      </p>

      {personas.length > 0 ? (
        <ul className={styles.list}>
          {personas.map((persona) => (
            <PersonaItem key={`${persona.id}:${persona.name}:${persona.description}`} persona={persona} />
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>아직 만든 프로필 캐릭터가 없습니다.</p>
      )}

      {full ? (
        <p className={styles.empty}>최대 {limit}개까지 만들 수 있습니다. 새로 만들려면 하나를 삭제하세요.</p>
      ) : (
        <form action={action} className={`${form.form} ${styles.createForm}`}>
          <h3 className={styles.subheading}>새로 만들기</h3>
          <PersonaFields values={state?.values} />
          <Status state={state} />
          <button type="submit" className={form.submit} disabled={pending}>
            {pending ? "만드는 중…" : "프로필 캐릭터 만들기"}
          </button>
        </form>
      )}
    </section>
  );
}
