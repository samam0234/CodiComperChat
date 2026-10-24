"use client";

import { useEffect, useId, useRef, useState } from "react";
import { loadQuest } from "@/app/actions/operations";
import form from "@/components/form.module.css";
import type { QuestView } from "@/lib/operations";
import bar from "./ops-bar.module.css";
import styles from "./photonet.module.css";
import quest from "./secret-quest.module.css";

function QuestIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.5 14.6 8l6 .8-4.4 4.2 1.1 6-5.3-2.9L6.7 19l1.1-6L3.4 8.8l6-.8L12 2.5Z"
      />
    </svg>
  );
}

// 비밀 퀘스트: 캐릭터가 친해진 뒤에 건네는 숨은 미션. 건네기 전에는 제목도 내용도 보이지 않는다.
// 대화가 오갈 때마다 (이야기 정리는 뒤에서 도니 잠시 뒤) 상태를 다시 읽어, 상태가 바뀌면 버튼에 점을 단다
export default function SecretQuest({ characterId, messageCount }: { characterId: string; messageCount: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<QuestView | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 마지막으로 열어 본 상태 — 그 뒤로 바뀌었으면 점
  const [seen, setSeen] = useState<string>("locked");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const statusOf = (v: QuestView | null) => (v && v.exists ? v.status : "locked");

  const refresh = async () => {
    const result = await loadQuest(characterId);
    if (result.ok) {
      setView(result.data);
      setError(null);
    } else setError(result.error);
  };

  // 대화가 오갈 때마다 잠시 뒤 다시 읽는다 (달성 전까지만)
  useEffect(() => {
    if (view && view.exists && view.status === "done") return;
    const timer = setTimeout(() => void refresh(), 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageCount]);

  const onOpen = () => {
    setOpen(true);
    setError(null);
    void refresh().then(() => undefined);
  };
  const onClose = () => {
    setSeen(statusOf(view));
    setOpen(false);
  };

  const status = statusOf(view);
  const news = !open && status !== "locked" && status !== seen;

  return (
    <>
      <button type="button" className={bar.tool} onClick={onOpen} aria-haspopup="dialog">
        <QuestIcon /> 비밀 퀘스트
        {news && <span className={quest.dot} role="img" aria-label="새 소식" />}
      </button>
      <dialog
        ref={ref}
        className={styles.dialog}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className={styles.body}>
          <div className={styles.head}>
            <h2 id={titleId} className={styles.title}>
              <QuestIcon /> 비밀 퀘스트
            </h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="비밀 퀘스트 닫기">
              ✕
            </button>
          </div>

          {error && (
            <p className={form.error} role="alert">
              {error}
            </p>
          )}
          {open && view && view.exists && <Body view={view} />}
          {open && !view && !error && <p className={styles.lead}>불러오는 중…</p>}
        </div>
      </dialog>
    </>
  );
}

function Body({ view }: { view: Extract<QuestView, { exists: true }> }) {
  if (!view.started) {
    return <p className={styles.lead}>먼저 이 캐릭터와 대화를 시작해 주세요. 이야기가 깊어지면 무언가를 부탁해 올지도 몰라요.</p>;
  }
  if (view.status === "locked") {
    return (
      <div className={quest.card}>
        <p className={quest.mystery}>???</p>
        <p className={styles.lead}>
          이 캐릭터는 아직 입 밖에 내지 않은 부탁을 마음에 두고 있어요. 대화를 이어 가며 더 가까워지면 먼저 꺼낼지도 몰라요.
        </p>
        <p className={quest.fine}>
          {view.credits > 0 ? `공식 캐릭터의 비밀 퀘스트를 이루면 ${view.credits} 코레딧을 받아요(한 번).` : "퀘스트는 이야기 속 부탁이에요."}
        </p>
      </div>
    );
  }
  const done = view.status === "done";
  return (
    <div className={quest.card}>
      <div className={quest.titleRow}>
        <strong className={quest.questTitle}>{view.title}</strong>
        <span className={done ? quest.badgeDone : quest.badge}>{done ? "달성" : "진행 중"}</span>
      </div>
      <dl className={quest.rows}>
        <div>
          <dt>건네받은 부탁</dt>
          <dd>{view.offer}</dd>
        </div>
        <div>
          <dt>이루려면</dt>
          <dd>{view.objective}</dd>
        </div>
        {done && view.reward && (
          <div>
            <dt>그 뒤</dt>
            <dd>{view.reward}</dd>
          </div>
        )}
      </dl>
      {view.credits > 0 && (
        <p className={quest.fine}>
          {done
            ? view.rewarded
              ? `${view.credits} 코레딧을 받았어요.`
              : "이미 받은 보상이에요."
            : `이루면 ${view.credits} 코레딧을 받아요(계정당 한 번).`}
        </p>
      )}
    </div>
  );
}
