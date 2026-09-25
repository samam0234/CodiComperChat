"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./character-chat.module.css";

type Turn = {
  role: "user" | "character";
  text: string;
};

type DisplayMessage = Turn & { id: number; error?: boolean; speaker?: string };

type PersonaOption = { id: string; name: string };

// 마지막으로 고른 프로필을 이 브라우저에서만 기억하는 편의 기능. 못 읽어도 기본값으로 동작한다
const PERSONA_STORAGE_KEY = "codicomperchat:persona";

function readSavedPersona(): string | null {
  try {
    return localStorage.getItem(PERSONA_STORAGE_KEY);
  } catch {
    return null;
  }
}

function savePersona(id: string) {
  try {
    localStorage.setItem(PERSONA_STORAGE_KEY, id);
  } catch {}
}

export default function CharacterChat({
  characterId,
  characterName,
  openingScene,
  loggedIn,
  personas,
}: {
  characterId: string;
  characterName: string;
  openingScene: string;
  loggedIn: boolean;
  personas: PersonaOption[];
}) {
  const nextId = useRef(1);
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { id: 0, role: "character", text: openingScene },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [personaId, setPersonaId] = useState(personas[0]?.id ?? "");

  useEffect(() => {
    const saved = readSavedPersona();
    if (saved !== null && (saved === "" || personas.some((p) => p.id === saved))) {
      setPersonaId(saved);
    }
  }, [personas]);

  const persona = personas.find((p) => p.id === personaId);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "" || sending) {
      return;
    }

    const history: Turn[] = messages.map(({ role, text: turnText }) => ({
      role,
      text: turnText,
    }));

    nextId.current += 1;
    setMessages((prev) => [
      ...prev,
      { id: nextId.current, role: "user", text: trimmed, speaker: persona?.name },
    ]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`/api/characters/${characterId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, personaId: persona?.id }),
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

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <input
          className={styles.input}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={`${characterName}에게 말 걸기`}
          aria-label="메시지 입력"
          disabled={sending}
        />
        <button
          type="submit"
          className={styles.submit}
          disabled={sending || input.trim() === ""}
        >
          보내기
        </button>
      </form>

      <div className={styles.personaBar}>
        {!loggedIn ? (
          <p className={styles.personaHint}>
            로그인하면 내 프로필 캐릭터로 대화할 수 있어요.{" "}
            <Link
              href={`/login?next=${encodeURIComponent(`/characters/${characterId}/chat`)}`}
              className={styles.personaLink}
            >
              로그인
            </Link>
          </p>
        ) : personas.length === 0 ? (
          <p className={styles.personaHint}>
            아직 프로필 캐릭터가 없어요.{" "}
            <Link href="/me" className={styles.personaLink}>
              마이페이지에서 만들기
            </Link>
          </p>
        ) : (
          <>
            <label className={styles.personaLabel} htmlFor="persona-select">
              내 프로필
            </label>
            <select
              id="persona-select"
              className={styles.personaSelect}
              value={personaId}
              onChange={(event) => {
                setPersonaId(event.target.value);
                savePersona(event.target.value);
              }}
            >
              <option value="">선택 안 함</option>
              {personas.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <Link href="/me" className={styles.personaLink}>
              관리
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
