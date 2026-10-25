import type { ReactNode } from "react";
import { fillUser, parseChat, type Block, type Inline } from "@/lib/chat-format";
import styles from "./chat-text.module.css";

// 대화 글을 꾸며 그린다. 표기 규칙은 lib/chat-format.ts. 글을 HTML로 넣지 않고 React 요소로만 만든다
function inline(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.type) {
      case "text":
        return n.text;
      case "code":
        return (
          <code key={i} className={styles.code}>
            {n.text}
          </code>
        );
      case "em":
        // *상황 설명*: 회색 기울임 (2026-10-24 사용자 요청: 흰 기울임이 아니라 40% 회색)
        return (
          <em key={i} className={styles.action}>
            {inline(n.children)}
          </em>
        );
      case "strong":
        return <strong key={i}>{inline(n.children)}</strong>;
      case "strongEm":
        return (
          <strong key={i}>
            <em>{inline(n.children)}</em>
          </strong>
        );
      case "del":
        return <del key={i}>{inline(n.children)}</del>;
    }
  });
}

// 줄을 줄바꿈으로 이어 붙인다
function lines(rows: Inline[][]): ReactNode {
  return rows.map((row, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {inline(row)}
    </span>
  ));
}

function block(b: Block, i: number): ReactNode {
  switch (b.type) {
    case "paragraph":
      return (
        <p key={i} className={styles.paragraph}>
          {lines(b.lines)}
        </p>
      );
    case "spaced":
      return (
        <p key={i} className={styles.spaced}>
          {lines(b.lines)}
        </p>
      );
    case "heading": {
      const Tag = (["h3", "h4", "h5"] as const)[b.level - 1];
      return (
        <Tag key={i} className={`${styles.heading} ${styles[`h${b.level}`]}`}>
          {inline(b.content)}
        </Tag>
      );
    }
    case "rule":
      return <hr key={i} className={styles.rule} />;
    case "quote":
      return (
        <blockquote key={i} className={styles.quote}>
          {lines(b.lines)}
        </blockquote>
      );
    case "list":
      return (
        <ul key={i} className={styles.list}>
          {b.items.map((item, j) => (
            <li key={j}>{inline(item)}</li>
          ))}
        </ul>
      );
    case "codeBlock":
      return (
        <pre key={i} className={styles.codeBlock}>
          {b.text}
        </pre>
      );
    case "infoBox":
      return (
        <details key={i} className={styles.infoBox} open>
          <summary className={styles.infoTitle}>{b.title}</summary>
          <div className={styles.infoBody}>{b.body.map(block)}</div>
        </details>
      );
    case "speech":
      return b.who === null ? (
        <p key={i} className={styles.narration}>
          {lines(b.lines)}
        </p>
      ) : (
        <p key={i} className={styles.speech}>
          <span className={styles.who}>{b.who}</span>
          {lines(b.lines)}
        </p>
      );
  }
}

export default function ChatText({ text, userName }: { text: string; userName: string }) {
  return <div className={styles.root}>{parseChat(fillUser(text, userName)).map(block)}</div>;
}
