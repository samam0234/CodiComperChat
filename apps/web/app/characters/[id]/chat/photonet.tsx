"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { createPhotonet, loadPhotonet } from "@/app/actions/operations";
import form from "@/components/form.module.css";
import { formatDayTime } from "@/lib/format-time";
import type { PhotonetView } from "@/lib/operations";
import bar from "./ops-bar.module.css";
import styles from "./photonet.module.css";

const PROMPT_MAX = 300;
const fmt = (n: number) => n.toLocaleString("ko-KR");
// 그림 본문 중계 (lib/operations.photonetSrc와 같은 주소. 그쪽은 server-only라 여기서 다시 만든다)
const srcOf = (characterId: string, imageId: string) =>
  `/api/characters/${encodeURIComponent(characterId)}/photonet/${encodeURIComponent(imageId)}`;

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 4.5 7.6 6.5H5A2.5 2.5 0 0 0 2.5 9v8.5A2.5 2.5 0 0 0 5 20h14a2.5 2.5 0 0 0 2.5-2.5V9A2.5 2.5 0 0 0 19 6.5h-2.6L15 4.5H9Zm3 4.5a4.25 4.25 0 1 1 0 8.5A4.25 4.25 0 0 1 12 9Zm0 2a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z"
      />
    </svg>
  );
}

// 코디포토넷: 대화 장면을 그림으로 만드는 창 (입력창 바로 위 왼쪽 버튼).
// 그림은 로컬 Stable Diffusion WebUI가 그린다. 엔진이 꺼져 있으면 "준비 중"으로 잠긴다
// moments: 고를 수 있는 최근 대사 (저장된 것만, 최근 것부터)
export type PhotonetMoment = { id: string; label: string };

export default function Photonet({
  characterId,
  sceneHint,
  moments,
}: {
  characterId: string;
  sceneHint: string;
  moments: PhotonetMoment[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<PhotonetView | null>(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("애니메이션");
  const [ratio, setRatio] = useState("정사각");
  // 그릴 장면: ""면 최근 대화, 아니면 고른 대사의 id
  const [momentId, setMomentId] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [making, setMaking] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // 창을 열 때마다 엔진 상태와 잔액을 새로 읽는다 (엔진을 켜고 끄는 일이 있으므로)
  const onOpen = () => {
    setOpen(true);
    setMessage(null);
    startTransition(async () => {
      const result = await loadPhotonet(characterId);
      if (result.ok) setStatus(result.data);
      else setMessage({ ok: false, text: result.error });
    });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if ((prompt.trim() === "" && momentId === "") || making) return;
    setMaking(true);
    setMessage(null);
    startTransition(async () => {
      const result = await createPhotonet(characterId, { prompt: prompt.trim(), style, ratio, messageId: momentId || undefined });
      setMaking(false);
      if (!result.ok) {
        setMessage({ ok: false, text: result.error });
        return;
      }
      setStatus((prev) => (prev ? { ...prev, balance: result.data.balance, images: [result.data.image, ...prev.images] } : prev));
      const cast = result.data.cast.length > 0 ? ` 등장: ${result.data.cast.join(" · ")}` : "";
      setMessage({ ok: true, text: `그림을 만들었어요.${cast}` });
    });
  };

  const ready = status?.ready ?? false;
  const poor = status ? status.balance < status.cost : false;

  return (
    <>
      <button type="button" className={bar.tool} onClick={onOpen} aria-haspopup="dialog">
        <CameraIcon /> 코디포토넷
      </button>
      <dialog
        ref={ref}
        className={styles.dialog}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          if (!making) setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && !making) setOpen(false);
        }}
      >
        <div className={styles.body}>
          <div className={styles.head}>
            <h2 id={titleId} className={styles.title}>
              <CameraIcon /> 코디포토넷
            </h2>
            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="코디포토넷 닫기" disabled={making}>
              ✕
            </button>
          </div>
          <p className={styles.lead}>지금 대화 장면을 한 장의 그림으로 만들어요. 그린 그림은 나에게만 보여요.</p>

          {status && !ready && (
            <p className={styles.soon} role="status">
              <strong>준비 중</strong> 그림 엔진(Stable Diffusion)이 꺼져 있어 지금은 만들 수 없어요. 코레딧은 빠지지 않아요.
            </p>
          )}
          {status && !status.started && <p className={styles.soon}>먼저 이 캐릭터와 대화를 시작해 주세요.</p>}

          <form className={styles.form} onSubmit={onSubmit}>
            <label className={form.field}>
              <span className={form.label}>장면 설명</span>
              <textarea
                className={`${form.input} ${styles.textarea}`}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                maxLength={PROMPT_MAX}
                rows={3}
                placeholder="예: 비 오는 오후, 창가 자리에서 따뜻한 차를 건네는 장면 (대사를 골랐으면 비워도 돼요)"
                disabled={making}
              />
            </label>
            {sceneHint && (
              <button type="button" className={styles.fill} onClick={() => setPrompt(sceneHint.slice(0, PROMPT_MAX))} disabled={making}>
                지금 장면으로 채우기
              </button>
            )}

            <label className={form.field}>
              <span className={form.label}>그릴 장면</span>
              <select
                className={`${form.input} ${styles.select}`}
                value={momentId}
                onChange={(event) => setMomentId(event.target.value)}
                disabled={making}
              >
                <option value="">최근 대화 (지금 장면)</option>
                {/* 창이 열렸을 때만 그린다 — 닫힌 창에 대사 글이 남으면 화면에 같은 글이 두 번 있는 셈이 된다 */}
                {open && moments.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <span className={form.hint}>대사를 고르면 그 앞뒤 장면을 그려요. 등장인물·줄거리는 대화 기록과 캐릭터·내 프로필에서 읽어요.</span>
            </label>

            <fieldset className={styles.chips} disabled={making}>
              <legend className={form.label}>화풍</legend>
              {(status?.styles ?? ["애니메이션", "웹툰", "수채화", "실사풍"]).map((s) => (
                <label key={s} className={styles.chip}>
                  <input type="radio" name="photonet-style" checked={style === s} onChange={() => setStyle(s)} />
                  {s}
                </label>
              ))}
            </fieldset>
            <fieldset className={styles.chips} disabled={making}>
              <legend className={form.label}>비율</legend>
              {(status?.ratios ?? ["정사각", "세로", "가로"]).map((r) => (
                <label key={r} className={styles.chip}>
                  <input type="radio" name="photonet-ratio" checked={ratio === r} onChange={() => setRatio(r)} />
                  {r}
                </label>
              ))}
            </fieldset>

            <div className={styles.footer}>
              <span className={styles.cost}>
                {status ? (
                  <>
                    그림 1장 <strong>{fmt(status.cost)} 코레딧</strong> · 내 코레딧 {fmt(status.balance)}
                    {poor && (
                      <>
                        {" "}
                        · <Link href="/me">출석하고 받기</Link>
                      </>
                    )}
                  </>
                ) : (
                  "불러오는 중…"
                )}
              </span>
              <button
                type="submit"
                className={styles.make}
                disabled={!ready || making || poor || !status?.started || (prompt.trim() === "" && momentId === "")}
              >
                {!status || ready ? (making ? "그리는 중…" : "만들기") : "준비 중"}
              </button>
            </div>
          </form>

          {making && (
            <p className={styles.progress} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              그리는 중이에요. 보통 30초 안팎이고, 애니메이션·웹툰과 수채화·실사풍 사이를 바꾼 첫 그림은 그림 모델을 다시 읽느라 2~3분 걸릴 수 있어요.
            </p>
          )}
          {message && (
            <p className={message.ok ? form.success : form.error} role={message.ok ? "status" : "alert"}>
              {message.text}
            </p>
          )}

          <section className={styles.gallery} aria-label="만든 그림">
            {status && status.images.length > 0 ? (
              <ul className={styles.grid}>
                {status.images.map((image) => (
                  <li key={image.id}>
                    <a href={srcOf(characterId, image.id)} target="_blank" rel="noopener noreferrer" className={styles.thumb}>
                      {/* 중계 라우트가 주는 그림이라 next/image 최적화를 거치지 않는다 */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={srcOf(characterId, image.id)}
                        alt={`${image.style} · ${image.prompt}`}
                        width={image.width}
                        height={image.height}
                        loading="lazy"
                      />
                    </a>
                    <span className={styles.meta}>
                      {image.style} · {formatDayTime(image.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>아직 만든 그림이 없어요.</p>
            )}
          </section>
        </div>
      </dialog>
    </>
  );
}
