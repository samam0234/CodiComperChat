"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { createPhotonet, loadPhotonet } from "@/app/actions/operations";
import form from "@/components/form.module.css";
import type { PhotonetView } from "@/lib/operations";
import bar from "./ops-bar.module.css";
import styles from "./photonet.module.css";

const PROMPT_MAX = 300;
const fmt = (n: number) => n.toLocaleString("ko-KR");

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
// 그림 엔진이 아직 없어 "준비 중"으로 잠가 두고, 장면 설명·화풍·비율·값까지 미리 보여 준다
export default function Photonet({ characterId, sceneHint }: { characterId: string; sceneHint: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<PhotonetView | null>(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("애니메이션");
  const [ratio, setRatio] = useState("정사각");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const onOpen = () => {
    setOpen(true);
    setMessage(null);
    if (!status) {
      startTransition(async () => {
        const result = await loadPhotonet(characterId);
        if (result.ok) setStatus(result.data);
        else setMessage(result.error);
      });
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (prompt.trim() === "") return;
    startTransition(async () => {
      const result = await createPhotonet(characterId, { prompt: prompt.trim(), style, ratio });
      setMessage(result.ok ? "그림을 만들었어요." : result.error);
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
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className={styles.body}>
          <div className={styles.head}>
            <h2 id={titleId} className={styles.title}>
              <CameraIcon /> 코디포토넷
            </h2>
            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="코디포토넷 닫기">
              ✕
            </button>
          </div>
          <p className={styles.lead}>지금 대화 장면을 한 장의 그림으로 만들어요.</p>

          {status && !ready && (
            <p className={styles.soon} role="status">
              <strong>준비 중</strong> 그림을 만드는 엔진을 연결하는 중이에요. 지금은 만들 수 없고, 코레딧도 빠지지 않아요.
            </p>
          )}
          {status && !status.started && (
            <p className={styles.soon}>먼저 이 캐릭터와 대화를 시작해 주세요.</p>
          )}

          <form className={styles.form} onSubmit={onSubmit}>
            <label className={form.field}>
              <span className={form.label}>장면 설명</span>
              <textarea
                className={`${form.input} ${styles.textarea}`}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                maxLength={PROMPT_MAX}
                rows={3}
                placeholder="예: 비 오는 오후, 창가 자리에서 따뜻한 차를 건네는 장면"
              />
            </label>
            {sceneHint && (
              <button type="button" className={styles.fill} onClick={() => setPrompt(sceneHint.slice(0, PROMPT_MAX))}>
                지금 장면으로 채우기
              </button>
            )}

            <fieldset className={styles.chips}>
              <legend className={form.label}>화풍</legend>
              {(status?.styles ?? ["애니메이션", "웹툰", "수채화", "실사풍"]).map((s) => (
                <label key={s} className={styles.chip}>
                  <input type="radio" name="photonet-style" checked={style === s} onChange={() => setStyle(s)} />
                  {s}
                </label>
              ))}
            </fieldset>
            <fieldset className={styles.chips}>
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
                disabled={!ready || pending || poor || !status?.started || prompt.trim() === ""}
              >
                {ready ? "만들기" : "준비 중"}
              </button>
            </div>
          </form>

          {message && (
            <p className={form.error} role="alert">
              {message}
            </p>
          )}

          <section className={styles.gallery} aria-label="만든 그림">
            {status && status.images.length > 0 ? null : <p className={styles.empty}>아직 만든 그림이 없어요.</p>}
          </section>
        </div>
      </dialog>
    </>
  );
}
