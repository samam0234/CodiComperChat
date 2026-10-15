"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { startNewConversation } from "@/app/actions/conversations";
import CharacterAvatar from "@/components/character-avatar";
import ChatInput from "@/components/chat-input";
import ChoiceDialog from "@/components/choice-dialog";
import ChatMenu from "./chat-menu";
import ExtrasPanel from "./extras-panel";
import StoryPanel from "./story-panel";
import styles from "./character-chat.module.css";

type Turn = {
  role: "user" | "character";
  text: string;
};

// 저장된 메시지는 서버 id(문자열), 방금 보낸 것은 임시 번호다
type DisplayMessage = Turn & {
  id: string | number;
  error?: boolean;
  // 답을 받지 못해 기록에 남지 않은 내 메시지
  unsaved?: boolean;
  speaker?: string | null;
};

export type InitialMessage = { id: string; role: "user" | "character"; text: string; speaker: string | null };

type PersonaOption = { id: string; name: string };

type SuggestionState =
  | { status: "closed" }
  | { status: "loading"; previous: string[] }
  | { status: "ready"; items: string[]; shown: string[] }
  | { status: "error"; message: string; shown: string[] };

// "초기화"를 여러 번 눌러도 같은 추천이 되풀이되지 않게 최근에 보여 준 것만 기억한다
const AVOID_LIMIT = 9;

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.5l1.9 5.1 5.1 1.9-5.1 1.9L12 16.5l-1.9-5.1L5 9.5l5.1-1.9L12 2.5zm6.5 11l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4zM6 15l.7 1.8 1.8.7-1.8.7L6 20l-.7-1.8-1.8-.7 1.8-.7L6 15z"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6l-.1 6.5L15 12l-11.7 1.9.1 6.5Z" />
    </svg>
  );
}

export default function CharacterChat({
  characterId,
  characterName,
  portrait,
  initialMessages,
  personas,
  lockedPersona: initialLocked,
  savedCount: initialSavedCount,
}: {
  characterId: string;
  characterName: string;
  // 캐릭터 말풍선 옆에 붙는 초상
  portrait?: { hasPortrait: boolean; version?: string };
  // 서버에 저장된 이 캐릭터와의 지금 대화 (처음이면 시작 장면 하나)
  initialMessages: InitialMessage[];
  personas: PersonaOption[];
  // 이 대화에 고정된 프로필. 첫 메시지 뒤로는 새로하기 전까지 바꿀 수 없다
  lockedPersona: PersonaOption | null;
  savedCount: number;
}) {
  const nextId = useRef(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  // 대화 전에 반드시 직접 골라야 한다 — 기본값을 미리 채우지 않는다
  const [personaId, setPersonaId] = useState(initialLocked?.id ?? "");
  const [locked, setLocked] = useState<PersonaOption | null>(initialLocked);
  const [savedCount, setSavedCount] = useState(initialSavedCount);
  const [suggestions, setSuggestions] = useState<SuggestionState>({ status: "closed" });
  const [newDialog, setNewDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  // 새로하기로 대화가 바뀌면 엑스트라 설정을 새 대화 기준으로 다시 그린다
  const [conversationKey, setConversationKey] = useState(0);

  // 고정된 프로필을 마이페이지에서 지웠어도 이 대화에서는 처음 고른 그대로 쓴다
  const persona =
    locked && personaId === locked.id ? locked : personas.find((p) => p.id === personaId);
  const chatPath = `/characters/${characterId}/chat`;
  const hasUserMessages = messages.some((m) => m.role === "user" && !m.unsaved);

  const startNew = async (save: boolean) => {
    setResetting(true);
    const result = await startNewConversation(characterId, save);
    setResetting(false);
    setNewDialog(false);
    if (!result.ok) {
      setNotice({ ok: false, text: result.error });
      return;
    }
    setMessages(result.data.messages);
    setLocked(null);
    setPersonaId("");
    setConversationKey((k) => k + 1);
    setSavedCount(result.data.savedCount);
    setInput("");
    setSuggestions({ status: "closed" });
    setNotice({
      ok: true,
      text: result.data.saved
        ? "대화를 저장하고 새로 시작했어요. 이어하기에서 다시 열 수 있습니다."
        : "새 대화를 시작했어요. 내 프로필을 다시 골라 주세요.",
    });
  };

  // 한 마디도 안 한 대화는 저장할 것이 없으니 묻지 않고 바로 새로 시작한다
  const onNewClick = () => {
    if (hasUserMessages) setNewDialog(true);
    else void startNew(false);
  };

  // 새 메시지가 오면(그리고 처음 열 때 긴 기록이 있으면) 맨 아래로 내린다
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages.length, sending]);

  const loadSuggestions = async (previous: string[]) => {
    if (!persona) return;
    setSuggestions({ status: "loading", previous });

    try {
      const res = await fetch(`/api/characters/${characterId}/chat/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: persona.id, avoid: previous }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.suggestions)) {
        setSuggestions({
          status: "ready",
          items: data.suggestions,
          shown: [...previous, ...data.suggestions].slice(-AVOID_LIMIT),
        });
      } else {
        setSuggestions({
          status: "error",
          message: data.message ?? `추천을 받지 못했습니다 (HTTP ${res.status})`,
          shown: previous,
        });
      }
    } catch {
      setSuggestions({
        status: "error",
        message: "API에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        shown: previous,
      });
    }
  };

  const toggleSuggestions = () => {
    if (suggestions.status === "closed") {
      void loadSuggestions([]);
    } else {
      setSuggestions({ status: "closed" });
    }
  };

  const pickSuggestion = (text: string) => {
    setInput(text);
    setSuggestions({ status: "closed" });
    inputRef.current?.focus();
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "" || sending || !persona) {
      return;
    }

    nextId.current += 1;
    const sentId = nextId.current;
    setMessages((prev) => [
      ...prev,
      { id: sentId, role: "user", text: trimmed, speaker: persona.name },
    ]);
    // 답을 못 받으면 서버에 저장되지 않는다. 그 사실을 내 말풍선에 표시한다
    const markUnsaved = () =>
      setMessages((prev) => prev.map((m) => (m.id === sentId ? { ...m, unsaved: true } : m)));
    setInput("");
    // 대화가 진행되면 이전 추천은 상황에 안 맞으므로 닫는다
    setSuggestions({ status: "closed" });
    setSending(true);

    try {
      const res = await fetch(`/api/characters/${characterId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, personaId: persona.id }),
      });
      const data = await res.json();

      nextId.current += 1;
      if (res.ok) {
        setMessages((prev) => [...prev, { id: nextId.current, role: "character", text: data.reply }]);
        // 첫 메시지가 저장되면 이 대화의 프로필로 고정된다 (서버도 같은 규칙으로 막는다)
        setLocked((current) => current ?? persona);
        setNotice(null);
      } else {
        markUnsaved();
        setMessages((prev) => [
          ...prev,
          {
            id: nextId.current,
            role: "character",
            text: data.message ?? `요청이 실패했습니다 (HTTP ${res.status})`,
            error: true,
          },
        ]);
      }
    } catch {
      markUnsaved();
      nextId.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current,
          role: "character",
          text: "API에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요.",
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (personas.length === 0 && !locked) {
    return (
      <div className={styles.gate}>
        <p className={styles.gateTitle}>대화하려면 내 프로필 캐릭터가 필요해요</p>
        <p className={styles.gateText}>
          {characterName}와 이야기할 때 내가 연기할 주인공입니다. 이름만 정해도 시작할 수 있어요.
        </p>
        <Link href={`/me?back=${encodeURIComponent(chatPath)}`} className={styles.gateButton}>
          프로필 캐릭터 만들기
        </Link>
      </div>
    );
  }

  const suggestionsOpen = suggestions.status !== "closed";
  const canType = persona !== undefined && !sending;

  return (
    <>
      <div className={styles.sessionBar}>
        <button
          type="button"
          className={styles.sessionButton}
          onClick={onNewClick}
          disabled={sending || resetting}
        >
          새로하기
        </button>
        <Link href={`${chatPath}/saved`} className={styles.sessionButton}>
          이어하기{savedCount > 0 && <span className={styles.sessionCount}>{savedCount}</span>}
        </Link>
      </div>
      {notice && (
        <p className={notice.ok ? styles.sessionNotice : styles.sessionError} role={notice.ok ? "status" : "alert"}>
          {notice.text}
        </p>
      )}
      <ChoiceDialog
        open={newDialog}
        title="대화를 저장하시겠습니까?"
        onClose={() => setNewDialog(false)}
        busy={resetting}
        choices={[
          { label: "취소", onSelect: () => setNewDialog(false) },
          { label: "저장 안 함", tone: "danger", onSelect: () => void startNew(false) },
          { label: "저장하겠습니다", tone: "primary", onSelect: () => void startNew(true) },
        ]}
      >
        저장하면 이어하기에서 이 대화를 다시 열 수 있어요. 저장하지 않으면 지금 대화와 기억·상태설정이 모두 지워지고
        처음부터 시작합니다.
      </ChoiceDialog>
      <div className={styles.chat}>
        <ChatMenu characterId={characterId} />
        <div className={styles.log} role="log" aria-live="polite" ref={logRef}>
          {messages.map((message) => (
            <div key={message.id} className={`${styles.row} ${message.role === "character" ? styles.rowCharacter : styles.rowUser}`}>
              {message.role === "character" && (
                <CharacterAvatar characterId={characterId} name={characterName} hasPortrait={!!portrait?.hasPortrait} version={portrait?.version} size="sm" />
              )}
              <div className={`${styles.message} ${styles[message.role]} ${message.error ? styles.error : ""}`}>
                {message.role === "character" && <span className={styles.speaker}>{characterName}</span>}
                {message.role === "user" && message.speaker && <span className={styles.userSpeaker}>{message.speaker}</span>}
                {message.text}
                {message.unsaved && <span className={styles.unsaved}>답을 받지 못해 기록에 남지 않았어요</span>}
              </div>
            </div>
          ))}

          {sending && (
            <div className={`${styles.row} ${styles.rowCharacter}`}>
              <CharacterAvatar characterId={characterId} name={characterName} hasPortrait={!!portrait?.hasPortrait} version={portrait?.version} size="sm" />
              <div className={styles.typing} role="status">
                <span className={styles.typingDots} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                {characterName}가 답하는 중…
              </div>
            </div>
          )}
        </div>

        {suggestionsOpen && (
          <div className={styles.suggestions} id="reply-suggestions">
            <div className={styles.suggestionsHead}>
              <span className={styles.suggestionsTitle}>대답 추천</span>
              <button
                type="button"
                className={styles.suggestionsReset}
                onClick={() =>
                  void loadSuggestions(
                    suggestions.status === "loading" ? suggestions.previous : suggestions.shown,
                  )
                }
                disabled={suggestions.status === "loading"}
              >
                초기화
              </button>
              <button
                type="button"
                className={styles.suggestionsClose}
                aria-label="대답 추천 닫기"
                onClick={() => setSuggestions({ status: "closed" })}
              >
                ✕
              </button>
            </div>

            {suggestions.status === "loading" && (
              <ul className={styles.suggestionList} aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <li key={i} className={styles.suggestionSkeleton} />
                ))}
              </ul>
            )}

            {suggestions.status === "ready" && (
              <ul className={styles.suggestionList}>
                {suggestions.items.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      className={styles.suggestion}
                      onClick={() => pickSuggestion(item)}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {suggestions.status === "error" && (
              <p className={styles.suggestionError} role="alert">
                {suggestions.message}
              </p>
            )}
          </div>
        )}

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <button
            type="button"
            className={styles.suggestButton}
            aria-label="대답 추천"
            title={persona ? "대답 추천" : "먼저 내 프로필을 선택하세요"}
            aria-expanded={suggestionsOpen}
            aria-controls="reply-suggestions"
            onClick={toggleSuggestions}
            disabled={!canType}
          >
            <SparkIcon />
          </button>
          <ChatInput
            inputRef={inputRef}
            value={input}
            onChange={setInput}
            onSubmit={() => void send(input)}
            placeholder={persona ? `${characterName}에게 말 걸기` : "먼저 프로필을 골라요"}
            maxLength={2000}
            disabled={!canType}
          />
          <button
            type="submit"
            className={styles.submit}
            disabled={!canType || input.trim() === ""}
          >
            <SendIcon />
            <span className={styles.submitLabel}>보내기</span>
          </button>
        </form>

        <div className={`${styles.personaBar} ${persona ? "" : styles.personaRequired}`}>
          <label className={styles.personaLabel} htmlFor="persona-select">
            내 프로필{!persona && <span className={styles.required}> (필수)</span>}
          </label>
          <select
            id="persona-select"
            className={styles.personaSelect}
            value={personaId}
            onChange={(event) => setPersonaId(event.target.value)}
            aria-required="true"
            aria-describedby={locked ? "persona-locked" : undefined}
            disabled={locked !== null}
          >
            <option value="" disabled>
              프로필을 선택하세요
            </option>
            {/* 고정된 프로필을 지웠으면 목록에 없으니 따로 넣어 보여 준다 */}
            {locked && !personas.some((p) => p.id === locked.id) && (
              <option value={locked.id}>{locked.name}</option>
            )}
            {personas.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          {locked ? (
            <span id="persona-locked" className={styles.personaLocked}>
              이 대화에서는 바꿀 수 없어요 · 바꾸려면 새로하기
            </span>
          ) : (
            <Link href={`/me?back=${encodeURIComponent(chatPath)}`} className={styles.personaLink}>
              관리
            </Link>
          )}
        </div>
      </div>
      <StoryPanel key={`story-${conversationKey}`} characterId={characterId} characterName={characterName} messageCount={messages.length} />
      <ExtrasPanel key={conversationKey} characterId={characterId} characterName={characterName} />
    </>
  );
}
