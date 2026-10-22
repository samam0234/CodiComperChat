"use client";

import { useEffect, useRef, useState } from "react";
import { loadDraft, resetTest, runCritique, sendTestTurn } from "@/app/actions/studio";
import ChatInput from "@/components/chat-input";
import ChatText from "@/components/chat-text";
import { VERDICT_LABELS, type Card, type TestState } from "@/lib/studio-card";
import type { Persona } from "./studio-editor";
import styles from "./studio-editor.module.css";

// §6.2 "같은 질문 '지금 뭐 해?'에 대한 샘플 답으로 말투를 검증". 눌러서 바로 보낼 수 있는 질문들
const QUICK = ["지금 뭐 해?", "오늘 기분 어때요?", "나 기억나?"];

export default function TestPanel({
  draftId,
  card,
  test,
  personas,
  ensureSaved,
  onTest,
}: {
  draftId: string;
  card: Card;
  test: TestState;
  personas: Persona[];
  ensureSaved: () => Promise<boolean>;
  onTest: (test: TestState) => void;
}) {
  const [message, setMessage] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 보낸 직후 답이 오기 전까지 내 말을 먼저 보여 준다
  const [optimistic, setOptimistic] = useState<string | null>(null);

  // 새 말이 붙으면 대화 칸 맨 아래로
  const transcriptRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [test.turns.length, optimistic, pending]);

  const done = test.turnsUsed >= test.turnsTotal;
  const busy = pending !== null;

  async function refresh() {
    const view = await loadDraft(draftId);
    if (view.ok) onTest(view.data.test);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy || done) return;
    setError(null);
    setPending("chat");
    if (!(await ensureSaved())) {
      setPending(null);
      setError("카드를 저장하지 못해 테스트할 수 없습니다. 위의 저장 오류를 먼저 고쳐 주세요.");
      return;
    }
    setOptimistic(trimmed);
    setMessage("");
    const result = await sendTestTurn(draftId, trimmed, personaId || undefined);
    if (!result.ok) {
      setError(result.error);
      setMessage(trimmed);
    }
    await refresh();
    setOptimistic(null);
    setPending(null);
  }

  async function critique() {
    setError(null);
    setPending("critique");
    const result = await runCritique(draftId);
    if (!result.ok) setError(result.error);
    await refresh();
    setPending(null);
  }

  async function reset() {
    setError(null);
    setPending("reset");
    const result = await resetTest(draftId);
    if (!result.ok) setError(result.error);
    await refresh();
    setPending(null);
  }

  const verdict = test.verdict;

  return (
    <section className={styles.test} aria-label="테스트 대화 3턴">
      <div className={styles.testHead}>
        <p className={styles.panelTitle}>
          테스트 대화 <span className={styles.count}>{test.turnsUsed}/{test.turnsTotal}턴</span>
        </p>
        {(test.turnsUsed > 0 || verdict) && (
          <button type="button" className={styles.textButton} onClick={() => void reset()} disabled={busy}>
            다시 테스트
          </button>
        )}
      </div>
      <p className={styles.hint}>발행 뒤 실제 대화와 같은 방식(카드 + 페르소나 지식 검색)으로 답합니다.</p>
      {test.stale && test.turnsUsed === 0 && (
        <p className={styles.staleNote}>카드를 고쳐서 이전 테스트가 무효가 됐습니다. 고친 카드로 다시 테스트하세요.</p>
      )}

      <label className={styles.personaSelect}>
        <span>테스트할 내 프로필</span>
        <select value={personaId} onChange={(e) => setPersonaId(e.target.value)} disabled={busy}>
          <option value="">테스트 유저 (기본)</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div ref={transcriptRef} className={styles.transcript} aria-live="polite">
        {card.greeting.firstMessage.trim() ? (
          <div className={styles.bubbleCharacter}>
            <ChatText text={card.greeting.firstMessage} userName="테스트 유저" />
          </div>
        ) : (
          <p className={styles.hint}>첫인사 단계의 첫 메시지가 여기 먼저 보입니다.</p>
        )}
        {test.turns.map((t, i) => (
          <div key={i} className={t.role === "user" ? styles.bubbleUser : styles.bubbleCharacter}>
            <ChatText text={t.text} userName="테스트 유저" />
          </div>
        ))}
        {optimistic && <p className={styles.bubbleUser}>{optimistic}</p>}
        {pending === "chat" && <p className={styles.typing}>답을 쓰는 중…</p>}
      </div>

      {!done && (
        <>
          <div className={styles.quick}>
            {QUICK.map((q) => (
              <button key={q} type="button" className={styles.chip} onClick={() => void send(q)} disabled={busy}>
                {q}
              </button>
            ))}
          </div>
          <div className={styles.testInput}>
            <ChatInput
              value={message}
              onChange={setMessage}
              onSubmit={() => void send(message)}
              placeholder="캐릭터에게 말 걸기"
              disabled={busy}
              maxLength={2000}
            />
            <button type="button" className={styles.primary} onClick={() => void send(message)} disabled={busy || !message.trim()}>
              보내기
            </button>
          </div>
        </>
      )}

      {done && !verdict && (
        <button type="button" className={styles.primary} onClick={() => void critique()} disabled={busy}>
          {pending === "critique" ? "판정 중…" : "3턴 판정 받기"}
        </button>
      )}

      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}

      {verdict && (
        <div className={verdict.passed ? styles.verdictPass : styles.verdictFail} role="status">
          <p className={styles.verdictTitle}>{verdict.passed ? "통과 — 발행할 수 있습니다" : "통과하지 못했습니다"}</p>
          <ul className={styles.verdictList}>
            {VERDICT_LABELS.map((v) => (
              <li key={v.key} className={verdict[v.key] ? styles.checkTodo : styles.checkOk}>
                {verdict[v.key] ? "걸림" : "없음"} · {v.label}
              </li>
            ))}
          </ul>
          {verdict.notes.length > 0 && (
            <ul className={styles.notes}>
              {verdict.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
          {!verdict.passed && <p className={styles.hint}>카드를 고치거나 &quot;다시 테스트&quot;로 새로 3턴을 해 보세요.</p>}
        </div>
      )}
    </section>
  );
}
