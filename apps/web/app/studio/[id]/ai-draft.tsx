"use client";

import { createContext, useContext, useState } from "react";
import { draftField } from "@/app/actions/studio";
import styles from "./studio-editor.module.css";

// 칸 하나를 AI로 초안 쓰기 (기획서 §6.1 "단계마다 '이 칸만 AI로 초안' 버튼, 전체 자동생성은 기본값으로 두지 않는다").
// 제안만 보여 주고 카드는 바뀌지 않는다 — 유저가 "적용하기"를 눌러야 칸에 들어간다.
// 서버가 저장된 카드로 만들므로 누르면 먼저 저장을 끝낸다. 비밀·해금 조건은 AI에 보내지 않는다

export type DraftTools = { draftId: string; ensureSaved: () => Promise<boolean> };
export const DraftToolsContext = createContext<DraftTools | null>(null);

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; value: string | string[] }
  | { status: "error"; message: string };

export function useAiDraft(fieldKey: string | undefined) {
  const tools = useContext(DraftToolsContext);
  const [state, setState] = useState<State>({ status: "idle" });

  const run = async () => {
    if (!tools || !fieldKey) return;
    setState({ status: "loading" });
    if (!(await tools.ensureSaved())) {
      setState({ status: "error", message: "카드를 저장하지 못해 초안을 만들 수 없습니다. 위의 저장 오류를 먼저 고쳐 주세요." });
      return;
    }
    const result = await draftField(tools.draftId, fieldKey);
    if (!result.ok) {
      setState({ status: "error", message: result.error });
    } else if (Array.isArray(result.data.value) ? result.data.value.length === 0 : result.data.value.trim() === "") {
      setState({ status: "error", message: "초안을 만들지 못했어요. 다시 만들어 보세요." });
    } else {
      setState({ status: "ready", value: result.data.value });
    }
  };

  return { enabled: !!tools && !!fieldKey, state, run, close: () => setState({ status: "idle" }) };
}

export function AiDraftButton({ label, draft }: { label: string; draft: ReturnType<typeof useAiDraft> }) {
  if (!draft.enabled) return null;
  return (
    <button
      type="button"
      className={styles.aiButton}
      onClick={() => void draft.run()}
      disabled={draft.state.status === "loading"}
      aria-label={`${label} AI 초안`}
      title="이 칸만 AI가 초안을 써 줘요. 보고 적용을 눌러야 들어갑니다"
    >
      {draft.state.status === "loading" ? "쓰는 중…" : "AI 초안"}
    </button>
  );
}

export function AiDraftPanel({
  label,
  draft,
  hasContent,
  onApply,
}: {
  label: string;
  draft: ReturnType<typeof useAiDraft>;
  // 이 칸에 이미 글이 있는가 (적용하면 바뀐다고 알려 준다)
  hasContent: boolean;
  onApply: (value: string | string[]) => void;
}) {
  const { state } = draft;
  if (state.status === "error") {
    return (
      <p className={styles.errorText} role="alert">
        {state.message}
      </p>
    );
  }
  if (state.status !== "ready") return null;
  const lines = Array.isArray(state.value) ? state.value : [state.value];
  return (
    <div className={styles.aiPanel} role="group" aria-label={`${label} AI 초안 제안`}>
      <p className={styles.aiTitle}>AI 초안 제안</p>
      <div className={styles.aiPreview}>
        {lines.map((line, i) => (
          <p key={i}>{Array.isArray(state.value) ? `• ${line}` : line}</p>
        ))}
      </div>
      <p className={styles.hint}>{hasContent ? "적용하면 지금 칸의 글이 이것으로 바뀝니다. " : ""}마음에 들지 않으면 다시 만들거나 고쳐 쓰세요.</p>
      <div className={styles.aiActions}>
        <button type="button" className={styles.textButton} onClick={draft.close}>
          닫기
        </button>
        <button type="button" className={styles.secondary} onClick={() => void draft.run()}>
          다시 만들기
        </button>
        <button
          type="button"
          className={styles.primary}
          onClick={() => {
            onApply(state.value);
            draft.close();
          }}
        >
          적용하기
        </button>
      </div>
    </div>
  );
}
