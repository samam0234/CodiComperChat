"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createWebtoon, drawWebtoonPanel, loadWebtoons } from "@/app/actions/operations";
import form from "@/components/form.module.css";
import { formatDay } from "@/lib/format-time";
import type { PhotonetRating, Webtoon, WebtoonView } from "@/lib/operations";
import ContentReport from "@/components/content-report";
import AdultDialog from "../adult-dialog";
import ops from "../ops.module.css";
import styles from "./webtoon.module.css";

const fmt = (n: number) => n.toLocaleString("ko-KR");
const PROMPT_MAX = 300;
// 그림 본문 중계 (Nest가 그 대화를 하는 사람인지 확인한다)
const srcOf = (characterId: string, webtoonId: string, index: number) =>
  `/api/characters/${encodeURIComponent(characterId)}/webtoon/${encodeURIComponent(webtoonId)}/${index}`;

// 웹툰 (오퍼레이션): 콘티를 먼저 무료로 짜고, 컷을 하나씩 그린다(한 컷 45 코레딧). 해설·대사는 그림 아래 글자로 붙인다.
// 한 편을 만들면 곧바로 첫 컷부터 차례로 그리고, 실패하거나 코레딧이 모자라면 멈춘다 — 남은 컷은 컷마다 "그리기"로 이어 그린다
export default function WebtoonPanel({ data: initial }: { data: WebtoonView }) {
  const [data, setData] = useState(initial);
  const name = data.character.name;
  const [webtoons, setWebtoons] = useState<Webtoon[]>(initial.webtoons);
  const [balance, setBalance] = useState(initial.balance);
  const [prompt, setPrompt] = useState("");
  const [panels, setPanels] = useState(4);
  const [rating, setRating] = useState<PhotonetRating>("sfw");
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 지금 그리는 컷 ("웹툰 id:컷 번호"), 콘티를 짜는 중인지
  const [drawing, setDrawing] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const busy = planning || drawing !== null;
  const adult = rating === "nsfw";

  const setPanel = (webtoonId: string, index: number, patch: Partial<Webtoon["panels"][number]>) =>
    setWebtoons((prev) =>
      prev.map((w) => (w.id === webtoonId ? { ...w, panels: w.panels.map((p) => (p.index === index ? { ...p, ...patch } : p)) } : w)),
    );

  // 컷 하나 그리기. 성공하면 true
  const draw = async (webtoonId: string, index: number): Promise<boolean> => {
    setDrawing(`${webtoonId}:${index}`);
    const result = await drawWebtoonPanel(data.character.id, webtoonId, index);
    setDrawing(null);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setPanel(webtoonId, index, result.data.panel);
    setBalance(result.data.balance);
    return true;
  };

  // 남은 컷을 차례로 (하나라도 실패하면 멈춘다)
  const drawRest = async (webtoon: Webtoon) => {
    for (const p of webtoon.panels) {
      if (p.drawn) continue;
      if (!(await draw(webtoon.id, p.index))) return;
    }
  };

  const onCreate = () =>
    startTransition(async () => {
      setError(null);
      setPlanning(true);
      const result = await createWebtoon(data.character.id, { prompt: prompt.trim(), panels, rating });
      setPlanning(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const webtoon = result.data.webtoon;
      setWebtoons((prev) => [webtoon, ...prev]);
      setPrompt("");
      await drawRest(webtoon);
    });

  const chooseRating = (next: PhotonetRating) => {
    if (next === "nsfw" && !data.nsfw.allowed) {
      setConfirmOpen(true);
      return;
    }
    setRating(next);
  };

  // 성인 확인을 마치면 다시 읽고 성인 모드로
  const onConfirmed = () => {
    setConfirmOpen(false);
    startTransition(async () => {
      const result = await loadWebtoons(data.character.id);
      if (!result.ok) return;
      setData(result.data);
      setWebtoons(result.data.webtoons);
      setRating("nsfw");
    });
  };

  const total = panels * data.cost;
  const poor = balance < data.cost;

  return (
    <div className={ops.page}>
      <header className={ops.head}>
        <span className={ops.eyebrow}>오퍼레이션 · 웹툰</span>
        <h1 className={ops.title}>{name}와의 이야기를 웹툰으로</h1>
        <p className={ops.lead}>
          대화 장면을 {data.minPanels}~{data.maxPanels}컷 웹툰으로 만들어요. 콘티(컷마다 장면·해설·대사)는 무료로 먼저 짜고, 컷은 하나씩
          그려요. 해설과 대사는 그림 아래 글자로 붙어요. 만든 웹툰은 나에게만 보여요.
        </p>
      </header>

      {!data.started ? (
        <p className={ops.notice}>
          아직 {name}와 나눈 대화가 없어요. <Link href={`/characters/${data.character.id}/chat`}>먼저 말을 걸어</Link> 보세요.
        </p>
      ) : !data.ready ? (
        <p className={ops.notice}>
          <strong>준비 중</strong> 그림 엔진(Stable Diffusion)이 꺼져 있어 지금은 만들 수 없어요. 코레딧은 빠지지 않아요.
        </p>
      ) : (
        <div className={styles.maker}>
          <div className={styles.rating} role="group" aria-label="수위">
            <button type="button" className={styles.ratingButton} aria-pressed={!adult} onClick={() => chooseRating("sfw")} disabled={busy}>
              전체 이용가
            </button>
            <button
              type="button"
              className={`${styles.ratingButton} ${styles.ratingAdult}`}
              aria-pressed={adult}
              onClick={() => chooseRating("nsfw")}
              disabled={busy}
            >
              <span className={styles.badge} aria-hidden="true">
                19
              </span>{" "}
              성인
            </button>
          </div>
          <label className={form.field}>
            <span className={form.label}>장면 설명</span>
            <textarea
              className={`${form.input} ${styles.textarea}`}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={PROMPT_MAX}
              rows={3}
              placeholder="예: 비 오는 날 우산 하나를 나눠 쓰고 돌아가는 길 (비워 두면 최근 대화를 그려요)"
              disabled={busy}
            />
          </label>
          <label className={form.field}>
            <span className={form.label}>컷 수</span>
            <select className={`${form.input} ${styles.select}`} value={panels} onChange={(event) => setPanels(Number(event.target.value))} disabled={busy}>
              {Array.from({ length: data.maxPanels - data.minPanels + 1 }, (_, i) => data.minPanels + i).map((n) => (
                <option key={n} value={n}>
                  {n}컷
                </option>
              ))}
            </select>
          </label>
          <div className={ops.action}>
            <span className={ops.actionText}>
              <span>
                한 컷 <strong>{fmt(data.cost)} 코레딧</strong> · {panels}컷이면 {fmt(total)} 코레딧 (콘티는 무료)
              </span>
              <small>
                내 코레딧 <span className={ops.balance}>{fmt(balance)}</span>
                {poor && (
                  <>
                    {" "}
                    · <Link href="/me">출석하고 코레딧 받기</Link>
                  </>
                )}
              </small>
            </span>
            <button type="button" className={ops.primary} onClick={onCreate} disabled={busy || poor}>
              {planning ? "콘티 짜는 중…" : drawing ? "그리는 중…" : "웹툰 만들기"}
            </button>
          </div>
          {adult && (
            <p className={styles.adultWarning} role="note">
              <strong>성인 모드</strong> 성인끼리의 성적 장면·폭력 묘사가 그려질 수 있어요. 미성년자로 보이는 인물, 실사에 가까운 그림, 강제적인 성적
              묘사는 만들지 않아요.
            </p>
          )}
          {busy && (
            <p className={styles.progress} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              {planning ? "콘티를 짜고 있어요. 컷 수에 따라 30초~1분쯤 걸려요." : "컷을 그리고 있어요. 한 컷에 보통 1분 안팎이에요."}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className={form.error} role="alert">
          {error}
        </p>
      )}

      {webtoons.length === 0 ? (
        data.started && <p className={ops.empty}>아직 만든 웹툰이 없어요.</p>
      ) : (
        <ol className={styles.list} aria-label="만든 웹툰">
          {webtoons.map((w) => {
            const left = w.panels.filter((p) => !p.drawn).length;
            return (
              <li key={w.id}>
                <article className={styles.webtoon} aria-label={w.title}>
                  <div className={styles.webtoonHead}>
                    <h2 className={styles.webtoonTitle}>
                      {w.rating === "nsfw" && (
                        <span className={styles.badge} aria-label="성인">
                          19
                        </span>
                      )}{" "}
                      {w.title}
                    </h2>
                    <time dateTime={w.createdAt}>{formatDay(w.createdAt)}</time>
                    {w.blocked ? null : (
                      <ContentReport
                        characterId={data.character.id}
                        target="WEBTOON"
                        targetId={w.id}
                        returnTo={`/characters/${data.character.id}/chat/webtoon`}
                      />
                    )}
                  </div>
                  {w.blocked ? (
                    <p className={styles.blocked}>운영 조치로 볼 수 없는 웹툰입니다. {w.blockReason}</p>
                  ) : (
                  <ol className={styles.panels}>
                    {w.panels.map((p) => {
                      const now = drawing === `${w.id}:${p.index}`;
                      return (
                        <li key={p.index} className={styles.panel}>
                          {p.drawn ? (
                            // 중계 라우트가 주는 그림이라 next/image 최적화를 거치지 않는다
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={srcOf(data.character.id, w.id, p.index)}
                              alt={`${w.title} ${p.index + 1}컷${p.caption ? ` · ${p.caption}` : ""}`}
                              width={p.width ?? undefined}
                              height={p.height ?? undefined}
                              loading="lazy"
                            />
                          ) : (
                            <div className={styles.blank}>
                              <span>{p.index + 1}컷 · {now ? "그리는 중…" : "아직 안 그렸어요"}</span>
                              {!now && (
                                <button
                                  type="button"
                                  className={styles.drawButton}
                                  onClick={() => startTransition(async () => void (await draw(w.id, p.index)))}
                                  disabled={busy || balance < data.cost}
                                >
                                  이 컷 그리기 · {fmt(data.cost)}
                                </button>
                              )}
                            </div>
                          )}
                          {p.caption && <p className={styles.caption}>{p.caption}</p>}
                          {p.lines.length > 0 && (
                            <ul className={styles.lines}>
                              {p.lines.map((line, i) => (
                                <li key={i} className={styles.line}>
                                  <span className={styles.speaker}>{line.speaker}</span>
                                  {line.text}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                  )}
                  {!w.blocked && left > 0 && left < w.panels.length && !busy && (
                    <button
                      type="button"
                      className={styles.rest}
                      onClick={() => startTransition(async () => drawRest(w))}
                      disabled={balance < data.cost}
                    >
                      남은 {left}컷 이어 그리기 · {fmt(left * data.cost)} 코레딧
                    </button>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}

      <AdultDialog
        open={confirmOpen}
        reason={data.nsfw.reason}
        message={data.nsfw.message}
        onClose={() => setConfirmOpen(false)}
        onConfirmed={onConfirmed}
      />
    </div>
  );
}
