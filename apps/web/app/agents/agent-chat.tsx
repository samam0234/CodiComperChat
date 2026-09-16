"use client";

import { useRef, useState } from "react";
import styles from "./agent-chat.module.css";

type ChatMessage = {
  id: number;
  author: "user" | "agent" | "system";
  text: string;
};

const SUGGESTIONS = [
  "캠페인이 뭔지 설명해 줘",
  "유지성이랑 뭘 할 수 있어?",
  "캐릭터를 만들 때 뭘 먼저 정해야 해?",
];

export default function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const nextId = useRef(0);

  const append = (author: ChatMessage["author"], text: string) => {
    nextId.current += 1;
    setMessages((prev) => [...prev, { id: nextId.current, author, text }]);
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "" || sending) {
      return;
    }

    append("user", trimmed);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      if (res.ok) {
        append("agent", data.reply);
      } else {
        append("system", data.message ?? `요청이 실패했습니다 (HTTP ${res.status})`);
      }
    } catch {
      append("system", "API에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.chat}>
      <div className={styles.log} role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>
              코디컴퍼챗 사용법이나 프롬프트를 물어보세요.
            </p>
            <ul className={styles.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    className={styles.suggestion}
                    onClick={() => void send(suggestion)}
                    disabled={sending}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.author]}`}
          >
            {message.text}
          </div>
        ))}

        {sending && <div className={styles.typing}>답변을 기다리는 중…</div>}
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
          placeholder="무엇이든 물어보세요"
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
