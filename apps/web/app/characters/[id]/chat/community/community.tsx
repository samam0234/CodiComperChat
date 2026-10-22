"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { refreshBoard, writeBoardPost } from "@/app/actions/operations";
import ChatText from "@/components/chat-text";
import form from "@/components/form.module.css";
import { formatDayTime } from "@/lib/format-time";
import type { BoardPost, BoardView } from "@/lib/operations";
import ops from "../ops.module.css";
import styles from "./community.module.css";

const fmt = (n: number) => n.toLocaleString("ko-KR");
const TITLE_MAX = 60;
const BODY_MAX = 1000;

// 커뮤니티: 캐릭터 세계 속 가상 익명 게시판. 주민(AI) 글을 불러오고, 나도 익명이나 실명(내 주인공)으로 글을 쓴다.
// 다른 유저와 나누지 않는다 — 이 대화를 하는 나에게만 보인다
export default function Community({ data }: { data: BoardView }) {
  const name = data.character.name;
  const [posts, setPosts] = useState<BoardPost[]>(data.posts);
  const [balance, setBalance] = useState(data.balance);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [writing, setWriting] = useState(false);
  const [busy, setBusy] = useState<"refresh" | "post" | null>(null);
  const [, startTransition] = useTransition();

  const onRefresh = () => {
    setBusy("refresh");
    setError(null);
    startTransition(async () => {
      const result = await refreshBoard(data.character.id);
      setBusy(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPosts((prev) => [...result.data.posts, ...prev]);
      setBalance(result.data.balance);
    });
  };

  const onPost = (event: FormEvent) => {
    event.preventDefault();
    if (title.trim() === "" || body.trim() === "") return;
    setBusy("post");
    setError(null);
    startTransition(async () => {
      const result = await writeBoardPost(data.character.id, { title: title.trim(), body: body.trim(), anonymous });
      setBusy(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPosts((prev) => [result.data.post, ...prev]);
      setBalance(result.data.balance);
      setTitle("");
      setBody("");
      setWriting(false);
    });
  };

  return (
    <div className={ops.page}>
      <header className={ops.head}>
        <span className={ops.eyebrow}>오퍼레이션 · 커뮤니티</span>
        <h1 className={ops.title}>{name}의 세계 · 동네 게시판</h1>
        <p className={ops.lead}>
          {name}가 사는 세계의 익명 게시판이에요. 주민들의 글을 불러오고, 나도 익명이나 내 주인공 실명으로 글을 쓸 수
          있어요. 주인공과 지인(이 대화의 엑스트라)은 실명으로 이야기될 수 있어요. 이 게시판은 나에게만 보여요.
        </p>
      </header>

      {!data.started ? (
        <p className={ops.notice}>
          아직 {name}와 나눈 대화가 없어요. <Link href={`/characters/${data.character.id}/chat`}>먼저 말을 걸어</Link> 보세요.
        </p>
      ) : (
        <>
          <div className={ops.action}>
            <span className={ops.actionText}>
              <span>
                새 글 불러오기 · <strong>{fmt(data.cost)} 코레딧</strong> · 내 글 쓰기 · <strong>{fmt(data.postCost)} 코레딧</strong>
              </span>
              <small>
                내 코레딧 <span className={ops.balance}>{fmt(balance)}</span>
                {balance < data.postCost && (
                  <>
                    {" "}
                    · <Link href="/me">출석하고 코레딧 받기</Link>
                  </>
                )}
              </small>
            </span>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setWriting((v) => !v)}
                aria-expanded={writing}
                aria-controls="board-write"
              >
                글쓰기
              </button>
              <button type="button" className={ops.primary} onClick={onRefresh} disabled={busy !== null || balance < data.cost}>
                {busy === "refresh" ? "불러오는 중…" : "새 글 불러오기"}
                <span className={ops.cost}>{fmt(data.cost)}</span>
              </button>
            </div>
          </div>

          {writing && (
            <form id="board-write" className={styles.write} onSubmit={onPost} aria-label="게시판 글쓰기">
              <fieldset className={styles.as}>
                <legend className={form.label}>글쓴이</legend>
                <label>
                  <input type="radio" name="as" checked={anonymous} onChange={() => setAnonymous(true)} /> 익명
                </label>
                <label>
                  <input type="radio" name="as" checked={!anonymous} onChange={() => setAnonymous(false)} /> 실명
                  {data.persona ? ` (${data.persona})` : ""}
                </label>
              </fieldset>
              <label className={form.field}>
                <span className={form.label}>제목</span>
                <input className={form.input} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX} required />
              </label>
              <label className={form.field}>
                <span className={form.label}>내용</span>
                <textarea
                  className={`${form.input} ${styles.textarea}`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={BODY_MAX}
                  rows={4}
                  required
                />
              </label>
              <button type="submit" className={ops.primary} disabled={busy !== null || title.trim() === "" || body.trim() === ""}>
                {busy === "post" ? "올리는 중…" : "올리기"}
                <span className={ops.cost}>{fmt(data.postCost)}</span>
              </button>
            </form>
          )}
        </>
      )}

      {error && (
        <p className={form.error} role="alert">
          {error}
        </p>
      )}

      {posts.length === 0 ? (
        data.started && <p className={ops.empty}>아직 올라온 글이 없어요. 새 글을 불러와 보세요.</p>
      ) : (
        <ol className={ops.list} aria-label="게시판 글">
          {posts.map((p) => (
            <li key={p.id}>
              <article className={styles.post}>
                <div className={styles.meta}>
                  <span className={p.authorKind === "USER" ? styles.me : styles.author}>
                    {p.authorName}
                    {p.authorKind === "USER" && <span className={styles.meTag}>나</span>}
                  </span>
                  <time dateTime={p.createdAt}>{formatDayTime(p.createdAt)}</time>
                </div>
                <h2 className={styles.title}>{p.title}</h2>
                <div className={styles.body}>
                  <ChatText text={p.body} userName={data.persona ?? "나"} />
                </div>
                {p.comments.length > 0 && (
                  <ul className={styles.comments} aria-label={`댓글 ${p.comments.length}개`}>
                    {p.comments.map((c) => (
                      <li key={c.id}>
                        <strong>{c.authorName}</strong> {c.body}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
