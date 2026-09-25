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
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { id: 0, role: "character", text: openingScene },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  // 대화 전에 반드시 직접 골라야 한다 — 기본값을 미리 채우지 않는다
  const [personaId, setPersonaId] = useState("");

  const persona = personas.find((p) => p.id === personaId);
  const chatPath = `/characters/${characterId}/chat`;

  const history = (): Turn[] =>
    messages.filter((m) => !m.error).map(({ role, text }) => ({ role, text }));

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
