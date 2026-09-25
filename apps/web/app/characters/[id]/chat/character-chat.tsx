"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./character-chat.module.css";

type Turn = {
  role: "user" | "character";
  text: string;
};

type DisplayMessage = Turn & { id: number; error?: boolean; speaker?: string };

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

export default function CharacterChat({
  characterId,
  characterName,
  openingScene,
  personas,
}: {
  characterId: string;
  characterName: string;
  openingScene: string;
  personas: PersonaOption[];
}) {
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { id: 0, role: "character", text: openingScene },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  // 대화 전에 반드시 직접 골라야 한다 — 기본값을 미리 채우지 않는다
  const [personaId, setPersonaId] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionState>({ status: "closed" });

  const persona = personas.find((p) => p.id === personaId);
  const chatPath = `/characters/${characterId}/chat`;

  const history = (): Turn[] =>
    messages.filter((m) => !m.error).map(({ role, text }) => ({ role, text }));

  const loadSuggestions = async (previous: string[]) => {
    if (!persona) return;
    setSuggestions({ status: "loading", previous });

    try {
      const res = await fetch(`/api/characters/${characterId}/chat/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: history(), personaId: persona.id, avoid: previous }),
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

    const turns = history();

    nextId.current += 1;
    setMessages((prev) => [
      ...prev,
      { id: nextId.current, role: "user", text: trimmed, speaker: persona.name },
    ]);
    setInput("");
    // 대화가 진행되면 이전 추천은 상황에 안 맞으므로 닫는다
    setSuggestions({ status: "closed" });
    setSending(true);

    try {
      const res = await fetch(`/api/characters/${characterId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: turns, personaId: persona.id }),
      });
      const data = await res.json();

      nextId.current += 1;
      if (res.ok) {
        setMessages((prev) => [...prev, { id: nextId.current, role: "character", text: data.reply }]);
      } else {
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

  if (personas.length === 0) {
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
    <div className={styles.chat}>
      <div className={styles.log} role="log" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.role]} ${message.error ? styles.error : ""}`}
          >
            {message.role === "character" && (
              <span className={styles.speaker}>{characterName}</span>
            )}
            {message.role === "user" && message.speaker && (
              <span className={styles.userSpeaker}>{message.speaker}</span>
            )}
            {message.text}
          </div>
        ))}

        {sending && <div className={styles.typing}>{characterName}가 답하는 중…</div>}
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
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={persona ? `${characterName}에게 말 걸기` : "먼저 내 프로필을 고르세요"}
          aria-label="메시지 입력"
          maxLength={2000}
          disabled={!canType}
        />
        <button
          type="submit"
          className={styles.submit}
          disabled={!canType || input.trim() === ""}
        >
          보내기
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
        >
          <option value="" disabled>
            프로필을 선택하세요
          </option>
          {personas.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <Link href={`/me?back=${encodeURIComponent(chatPath)}`} className={styles.personaLink}>
          관리
        </Link>
      </div>
    </div>
  );
}
