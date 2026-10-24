"use client";

import { useState } from "react";
import { generatePortrait } from "@/app/actions/studio";
import type { DraftView } from "@/lib/studio-card";
import styles from "./studio-editor.module.css";
import ai from "./portrait-ai.module.css";

const COST = 25;
const EXTRA_MAX = 100;

// 고르는 항목 (키는 서버와 같다 — apps/api/src/studio/studio-portrait-ai.service.ts)
const STYLES = ["애니메이션", "웹툰", "수채화", "실사풍"] as const;
const OPTIONS: { key: string; label: string; choices: [string, string][] }[] = [
  { key: "gender", label: "성별", choices: [["female", "여성"], ["male", "남성"], ["other", "정하지 않음"]] },
  { key: "age", label: "나이대", choices: [["20s", "20대"], ["30s", "30대"], ["40s", "40대"], ["50s", "50대 이상"]] },
  {
    key: "hairColor",
    label: "머리색",
    choices: [["black", "검정"], ["brown", "갈색"], ["blonde", "금발"], ["silver", "은발"], ["red", "빨강"], ["blue", "파랑"], ["pink", "분홍"], ["white", "흰색"]],
  },
  {
    key: "hairStyle",
    label: "머리 모양",
    choices: [["short", "짧은 머리"], ["bob", "단발"], ["long", "긴 생머리"], ["ponytail", "포니테일"], ["wavy", "긴 웨이브"], ["updo", "올림머리"]],
  },
  {
    key: "eyeColor",
    label: "눈 색",
    choices: [["black", "검정"], ["brown", "갈색"], ["blue", "파랑"], ["green", "초록"], ["red", "빨강"], ["purple", "보라"], ["gold", "금색"]],
  },
  {
    key: "outfit",
    label: "옷차림",
    choices: [["casual", "캐주얼"], ["suit", "정장"], ["knit", "셔츠·니트"], ["dress", "드레스"], ["armor", "판타지 갑옷"], ["robe", "마법사 로브"], ["hanbok", "한복"], ["sports", "운동복"]],
  },
  {
    key: "expression",
    label: "표정",
    choices: [["smile", "미소"], ["calm", "차분함"], ["cold", "차가움"], ["shy", "수줍음"], ["playful", "장난스러움"], ["serious", "진지함"]],
  },
  {
    key: "background",
    label: "배경",
    choices: [["plain", "단색"], ["indoor", "실내"], ["outdoor", "야외"], ["city", "도시 야경"], ["fantasy", "판타지"]],
  },
];

type PortraitState = Pick<DraftView, "hasPortrait" | "portraitReview" | "portraitReviewNote">;

// 공방 외형 단계: AI로 흉상 초상 만들기 (2026-10-25 사용자 요청, 한 장 25 코레딧).
// 화풍 하나와 생김새를 고르면 그림 엔진이 그리고, 올린 그림과 같은 자동 검수를 거쳐 초상이 된다
export default function PortraitAi({
  draftId,
  busy,
  onBusy,
  onChange,
}: {
  draftId: string;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onChange: (next: PortraitState) => void;
}) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<string>("애니메이션");
  const [options, setOptions] = useState<Record<string, string>>(
    Object.fromEntries(OPTIONS.map((o) => [o.key, o.choices[0][0]])),
  );
  const [extra, setExtra] = useState("");
  const [useCard, setUseCard] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const make = async () => {
    onBusy(true);
    setMessage(null);
    const result = await generatePortrait(draftId, { style, options, extra: extra.trim(), useCard });
    onBusy(false);
    if (!result.ok) {
      setMessage({ ok: false, text: result.error });
      return;
    }
    onChange(result.data.draft);
    setMessage({ ok: true, text: `초상을 만들었어요. ${result.data.cost} 코레딧을 썼고, 남은 코레딧은 ${result.data.balance.toLocaleString("ko-KR")}이에요.` });
  };

  if (!open) {
    return (
      <button type="button" className={styles.secondary} onClick={() => setOpen(true)} disabled={busy}>
        AI로 직접 만들기 · {COST} 코레딧
      </button>
    );
  }

  return (
    <div className={ai.panel} role="group" aria-label="AI로 초상 만들기">
      <div className={ai.head}>
        <p className={styles.label}>AI로 초상 만들기</p>
        <button type="button" className={styles.textButton} onClick={() => setOpen(false)} disabled={busy}>
          닫기
        </button>
      </div>
      <fieldset className={ai.styles} disabled={busy}>
        <legend className={ai.legend}>화풍</legend>
        {STYLES.map((s) => (
          <label key={s} className={ai.chip}>
            <input type="radio" name={`portrait-style-${draftId}`} checked={style === s} onChange={() => setStyle(s)} />
            {s}
          </label>
        ))}
      </fieldset>
      <div className={ai.grid}>
        {OPTIONS.map((o) => (
          <label key={o.key} className={ai.field}>
            <span className={ai.legend}>{o.label}</span>
            <select
              className={ai.select}
              value={options[o.key]}
              onChange={(e) => setOptions((prev) => ({ ...prev, [o.key]: e.target.value }))}
              disabled={busy}
            >
              {o.choices.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <label className={ai.field}>
        <span className={ai.legend}>추가로 원하는 생김새 (선택)</span>
        <input
          className={ai.select}
          value={extra}
          maxLength={EXTRA_MAX}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="예: 얇은 안경, 왼쪽 눈 아래 점"
          disabled={busy}
        />
      </label>
      <label className={ai.check}>
        <input type="checkbox" checked={useCard} onChange={(e) => setUseCard(e.target.checked)} disabled={busy} />
        카드의 외형 서술·분위기 키워드도 반영하기
      </label>
      <p className={styles.hint}>
        모든 인물은 성인으로, 누구나 볼 수 있는 그림으로 그려요. 만든 그림은 올린 그림처럼 자동 검수를 거치고, 못 만들거나 검수에서 막히면 코레딧을
        돌려드려요. 한 장에 1분 안팎(화풍을 바꾼 첫 장은 더) 걸려요.
      </p>
      <div className={styles.portraitActions}>
        <button type="button" className={styles.primary} onClick={() => void make()} disabled={busy}>
          {busy ? "그리는 중…" : `만들기 · ${COST} 코레딧`}
        </button>
      </div>
      {message && (
        <p className={message.ok ? ai.ok : styles.errorText} role={message.ok ? "status" : "alert"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
