"use client";

import { useRef, useState } from "react";
import { removePortrait, uploadPortrait } from "@/app/actions/studio";
import type { DraftView, PortraitReview } from "@/lib/studio-card";
import styles from "./studio-editor.module.css";

// 흉상 초상 (기획서 §6.2 "채팅 옆에 붙을 흉상 초상이 우선, 전신 일러스트 공장은 v1 범위 밖").
// AI로 그려 주지는 않고, 올린 그림을 정사각형으로 잘라 줄여서 올린다. 서버도 형식·크기를 다시 검사한다.
const SIDE = 320;
const TARGET_BYTES = 120_000;

// 얼굴이 위쪽에 있는 흉상이 많아 세로로 긴 그림은 위쪽을 더 남긴다
async function toPortraitBlob(file: File): Promise<Blob> {
  // 깨졌거나 그림이 아닌 파일이면 브라우저가 영어 오류를 던지므로 한국어로 바꾼다
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("이 파일은 그림으로 열 수 없습니다. 다른 그림(png·jpeg·webp)을 골라 주세요.");
  });
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) * 0.2;
  const canvas = document.createElement("canvas");
  canvas.width = SIDE;
  canvas.height = SIDE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이 브라우저에서는 이미지를 줄일 수 없습니다.");
  context.drawImage(bitmap, sx, sy, side, side, 0, 0, SIDE, SIDE);
  bitmap.close();

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  for (const type of ["image/webp", "image/jpeg"]) {
    for (const quality of [0.9, 0.8, 0.7, 0.6, 0.5]) {
      const blob = await toBlob(type, quality);
      // 브라우저가 webp를 못 만들면 png로 돌려주므로 요청한 형식이 맞는지 본다
      if (blob && blob.type === type && blob.size <= TARGET_BYTES) return blob;
    }
  }
  throw new Error("이미지를 충분히 줄이지 못했습니다. 다른 그림을 써 주세요.");
}

type PortraitState = Pick<DraftView, "hasPortrait" | "portraitReview" | "portraitReviewNote">;

// 검수 상태 안내. 승인된 초상만 남에게 보인다
function ReviewBadge({ review, note }: { review: PortraitReview | null; note: string | null }) {
  if (review === "PENDING") {
    return (
      <p className={styles.reviewPending} role="status">
        운영자 확인 중 — 확인이 끝날 때까지 다른 사람에게는 초상 없이 보여요.{note ? ` (${note})` : ""}
      </p>
    );
  }
  if (review === "REJECTED") {
    return (
      <p className={styles.errorText} role="status">
        운영자가 이 그림을 반려했어요{note ? `: ${note}` : "."} 다른 그림으로 바꿔 주세요.
      </p>
    );
  }
  return null;
}

export default function PortraitUploader({
  draftId,
  hasPortrait,
  review,
  reviewNote,
  version,
  onChange,
}: {
  draftId: string;
  hasPortrait: boolean;
  review: PortraitReview | null;
  reviewNote: string | null;
  // 바뀔 때마다 달라지는 값(미리보기 캐시 무효화용)
  version: string;
  onChange: (next: PortraitState) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일(webp·jpeg·png 등)을 골라 주세요.");
      return;
    }
    setBusy(true);
    try {
      const blob = await toPortraitBlob(file);
      const form = new FormData();
      form.set("file", new File([blob], "portrait", { type: blob.type }));
      const result = await uploadPortrait(draftId, form);
      if (result.ok) onChange(result.data);
      else setError(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지를 올리지 못했습니다.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    const result = await removePortrait(draftId);
    setBusy(false);
    if (result.ok) onChange(result.data);
    else setError(result.error);
  };

  return (
    <section className={styles.portrait} aria-label="흉상 초상">
      <div className={styles.portraitPreview}>
        {hasPortrait ? (
          // 공방 초안 중계(만든 사람만). 바뀌면 version이 달라져 새로 받는다
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/studio/${encodeURIComponent(draftId)}/portrait?v=${encodeURIComponent(version)}`} alt="올린 흉상 초상" width={96} height={96} />
        ) : (
          <span aria-hidden="true">초상 없음</span>
        )}
      </div>
      <div className={styles.portraitBody}>
        <p className={styles.label}>흉상 초상</p>
        <p className={styles.hint}>
          채팅 옆과 목록에 붙는 정사각형 얼굴 그림이에요. 그림을 고르면 알아서 정사각형으로 잘라 줄입니다. 직접 그리거나 쓸 권리가 있는
          그림만 올려 주세요. 올린 그림은 자동으로 검수하고, 애매하면 운영자가 확인한 뒤에 보여요.
        </p>
        <ReviewBadge review={hasPortrait ? review : null} note={reviewNote} />
        <div className={styles.portraitActions}>
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className={styles.srOnly}
            id={`portrait-${draftId}`}
            onChange={(e) => void pick(e.target.files?.[0])}
            disabled={busy}
          />
          <label htmlFor={`portrait-${draftId}`} className={busy ? styles.secondaryDisabled : styles.secondary} role="button" tabIndex={busy ? -1 : 0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !busy && (e.preventDefault(), input.current?.click())}>
            {busy ? "검수하는 중…" : hasPortrait ? "그림 바꾸기" : "그림 고르기"}
          </label>
          {hasPortrait && (
            <button type="button" className={styles.textButton} onClick={() => void remove()} disabled={busy}>
              지우기
            </button>
          )}
        </div>
        {error && (
          <p className={styles.errorText} role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
