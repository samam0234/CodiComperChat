"use client";

import { useState } from "react";
import { sampleReplies } from "@/app/actions/studio";
import styles from "./studio-editor.module.css";

// 기획서 §6.2: 성격·말투 단계에서 같은 질문("지금 뭐 해?")에 대한 샘플 답 2개를 바로 보여 말투를 검증한다.
// 3턴 테스트와 별개로 저장되지 않는다. 서버가 저장된 카드로 답하므로 먼저 저장을 끝낸다
export default function SampleReplies({
  draftId,
  ready,
  ensureSaved,
}: {
  draftId: string;
  // 이름·반말/존댓말이 채워졌는가
  ready: boolean;
  ensureSaved: () => Promise<boolean>;
}) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "done"; question: string; replies: string[] }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const run = async () => {
    setState({ status: "loading" });
    if (!(await ensureSaved())) {
      setState({ status: "error", message: "카드를 저장하지 못해 샘플을 만들 수 없습니다. 위의 저장 오류를 먼저 고쳐 주세요." });
      return;
    }
    const result = await sampleReplies(draftId);
    setState(
      result.ok
        ? { status: "done", question: result.data.question, replies: result.data.replies }
        : { status: "error", message: result.error },
    );
  };

  return (
    <section className={styles.samples} aria-label="말투 샘플">
      <div className={styles.samplesHead}>
        <p className={styles.label}>말투 샘플</p>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => void run()}
          disabled={!ready || state.status === "loading"}
        >
          {state.status === "loading" ? "만드는 중…" : state.status === "done" ? "다시 보기" : "샘플 답 보기"}
        </button>
      </div>
      <p className={styles.hint}>
        {ready
          ? "같은 질문에 지금 카드로 답을 2개 만들어 말투를 확인해요. 테스트 3턴에는 포함되지 않습니다."
          : "이름(정체성 단계)과 반말/존댓말을 정하면 샘플을 볼 수 있어요."}
      </p>

      {state.status === "done" && (
        <div className={styles.sampleList} aria-live="polite">
          <p className={styles.bubbleUser}>{state.question}</p>
          {state.replies.map((reply, i) => (
            <p key={i} className={styles.bubbleCharacter}>
              {reply}
            </p>
          ))}
          <p className={styles.hint}>말투·습관이 의도와 다르면 위 칸을 고치고 다시 보세요.</p>
        </div>
      )}
      {state.status === "error" && (
        <p className={styles.errorText} role="alert">
          {state.message}
        </p>
      )}
    </section>
  );
}
