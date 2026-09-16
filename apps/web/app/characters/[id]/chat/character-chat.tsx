"use client";

import { useRef, useState } from "react";
import styles from "./character-chat.module.css";

type Turn = {
  role: "user" | "character";
  text: string;
};

type DisplayMessage = Turn & { id: number; error?: boolean };

export default function CharacterChat({
  characterId,
  characterName,
  openingScene,
}: {
  characterId: string;
  characterName: string;
  openingScene: string;
}) {
  const nextId = useRef(1);
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { id: 0, role: "character", text: openingScene },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

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
    setMessages((prev) => [...prev, { id: nextId.current, role: "user", text: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`/api/characters/${characterId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
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
    </div>
  );
}
