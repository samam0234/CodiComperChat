"use client";

import { useActionState, useState } from "react";
import { saveChatState } from "@/app/actions/chat-state";
import form from "@/components/form.module.css";
import styles from "../subpage.module.css";

// apps/api chat-state.service.ts의 relationshipLabel과 같은 구간이어야 한다
function relationshipLabel(value: number): string {
  if (value >= 80) return "각별한 사이";
  if (value >= 60) return "가까운 사이";
  if (value >= 40) return "편한 사이";
  if (value >= 20) return "알아 가는 중";
  return "처음 만난 사이";
}

type State = { relationshipValue: number; relationshipNote: string | null; userNickname: string | null };

export default function StateForm({
  characterId,
  characterName,
  addressing,
  initial,
}: {
  characterId: string;
  characterName: string;
  addressing: string;
  initial: State;
}) {
  const [state, action, pending] = useActionState(saveChatState, undefined);
  const [value, setValue] = useState(
    Number(state?.values?.relationshipValue ?? initial.relationshipValue),
  );

  return (
    <form action={action} className={form.form}>
      <input type="hidden" name="characterId" value={characterId} />

      <section className={styles.section} aria-labelledby="relationship-heading">
        <h2 id="relationship-heading" className={styles.sectionTitle}>
          관계 상태
        </h2>
        <p className={styles.sectionHint}>
          {characterName}가 나를 얼마나 가깝게 느끼는지입니다. 높을수록 편하고 친근하게 대합니다.
        </p>

        <label className={form.field}>
          <span className={form.label}>
            친밀도 <strong className={styles.valueBadge}>{value}</strong>{" "}
            <span className={styles.valueLabel}>{relationshipLabel(value)}</span>
          </span>
          <input
            className={styles.range}
            type="range"
            name="relationshipValue"
            min={0}
            max={100}
            step={5}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            aria-valuetext={`${value}, ${relationshipLabel(value)}`}
          />
          <span className={styles.rangeScale} aria-hidden="true">
            <span>처음 만남</span>
            <span>각별함</span>
          </span>
        </label>

        <label className={form.field}>
          <span className={form.label}>관계 메모 (선택)</span>
          <textarea
            className={`${form.input} ${styles.textarea}`}
            name="relationshipNote"
            defaultValue={state?.values?.relationshipNote ?? initial.relationshipNote ?? ""}
            maxLength={200}
            rows={3}
            placeholder="예: 모의고사 끝나면 떡볶이 먹기로 약속한 사이"
          />
        </label>
      </section>

      <section className={styles.section} aria-labelledby="nickname-heading">
        <h2 id="nickname-heading" className={styles.sectionTitle}>
          나를 부르는 호칭
        </h2>
        <p className={styles.sectionHint}>
          비워 두면 캐릭터 설정대로 부릅니다. 지금 설정: {addressing}
        </p>
        <label className={form.field}>
          <span className={form.label}>호칭</span>
          <input
            className={form.input}
            name="userNickname"
            defaultValue={state?.values?.userNickname ?? initial.userNickname ?? ""}
            maxLength={20}
            placeholder="예: 서윤아"
          />
        </label>
      </section>

      {state?.error && (
        <p className={form.error} role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className={form.success} role="status">
          {state.success}
        </p>
      )}
      <button type="submit" className={form.submit} disabled={pending}>
        {pending ? "저장하는 중…" : "저장"}
      </button>
    </form>
  );
}
