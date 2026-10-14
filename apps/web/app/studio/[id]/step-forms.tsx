"use client";

import { useId, type ReactNode } from "react";
import {
  AXES,
  HONORIFIC_OPTIONS,
  LIMITS,
  ROLE_OPTIONS,
  type Card,
  type StepKey,
} from "@/lib/studio-card";
import PromptExtendButton from "./prompt-extend";
import styles from "./studio-editor.module.css";

export type Update = (mutate: (card: Card) => void) => void;

function Field({
  label,
  hint,
  required,
  count,
  max,
  extendable,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  count?: number;
  max?: number;
  // 긴 글 칸이면 "프롬프트 연장"(프로 등급 안내)을 붙인다
  extendable?: boolean;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}> 필수</span>}
        </label>
        {max !== undefined && count !== undefined && (
          <span className={styles.fieldTools}>
            <span className={count > max ? styles.countOver : styles.count}>
              {count}/{max}
            </span>
            {extendable && <PromptExtendButton label={label} max={max} />}
          </span>
        )}
      </div>
      {children(id)}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

function Text({
  label,
  value,
  max,
  onChange,
  hint,
  required,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  max: number;
  onChange: (v: string) => void;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Field label={label} hint={hint} required={required} count={value.length} max={max} extendable={rows !== undefined}>
      {(id) =>
        rows ? (
          <textarea
            id={id}
            className={styles.textarea}
            value={value}
            maxLength={max}
            rows={rows}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            id={id}
            className={styles.input}
            value={value}
            maxLength={max}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      }
    </Field>
  );
}

// 한 줄에 하나씩. 빈 줄은 저장할 때 서버가 버린다
function Lines({
  label,
  value,
  maxItems,
  maxLen,
  onChange,
  hint,
  required,
  placeholder,
}: {
  label: string;
  value: string[];
  maxItems: number;
  maxLen: number;
  onChange: (v: string[]) => void;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const filled = value.filter((v) => v.trim() !== "").length;
  return (
    <Field
      label={label}
      hint={hint ?? `한 줄에 하나씩, ${maxItems}개까지 (각 ${maxLen}자)`}
      required={required}
      count={filled}
      max={maxItems}
    >
      {(id) => (
        <textarea
          id={id}
          className={styles.textarea}
          value={value.join("\n")}
          rows={Math.min(Math.max(value.length, 2), maxItems)}
          placeholder={placeholder}
          onChange={(e) =>
            onChange(
              e.target.value
                .split("\n")
                .slice(0, maxItems)
                .map((line) => line.slice(0, maxLen)),
            )
          }
        />
      )}
    </Field>
  );
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: T | "";
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
  required?: boolean;
}) {
  return (
    <fieldset className={styles.field}>
      <legend className={styles.label}>
        {label}
        {required && <span className={styles.required}> 필수</span>}
      </legend>
      <div className={styles.choices}>
        {options.map((o) => (
          <label key={o.value} className={value === o.value ? styles.choiceOn : styles.choice} title={o.hint}>
            <input
              type="radio"
              className={styles.srOnly}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
      {options.find((o) => o.value === value)?.hint && (
        <p className={styles.hint}>{options.find((o) => o.value === value)?.hint}</p>
      )}
    </fieldset>
  );
}

function Pairs<K extends string>({
  label,
  items,
  max,
  keys,
  onChange,
  hint,
  addLabel,
}: {
  label: string;
  items: Record<K, string>[];
  max: number;
  keys: { key: K; label: string; max: number; rows?: number }[];
  onChange: (v: Record<K, string>[]) => void;
  hint?: string;
  addLabel: string;
}) {
  const empty = Object.fromEntries(keys.map((k) => [k.key, ""])) as Record<K, string>;
  return (
    <fieldset className={styles.field}>
      <legend className={styles.label}>
        {label} <span className={styles.count}>{items.length}/{max}</span>
      </legend>
      {hint && <p className={styles.hint}>{hint}</p>}
      {items.map((item, i) => (
        <div key={i} className={styles.pair}>
          {keys.map((k) => (
            <textarea
              key={k.key}
              aria-label={`${label} ${i + 1} ${k.label}`}
              className={styles.textarea}
              rows={k.rows ?? 2}
              maxLength={k.max}
              placeholder={k.label}
              value={item[k.key]}
              onChange={(e) => onChange(items.map((it, j) => (j === i ? { ...it, [k.key]: e.target.value } : it)))}
            />
          ))}
          <button type="button" className={styles.textButton} onClick={() => onChange(items.filter((_, j) => j !== i))}>
            {i + 1}번 지우기
          </button>
        </div>
      ))}
      {items.length < max && (
        <button type="button" className={styles.addButton} onClick={() => onChange([...items, { ...empty }])}>
          + {addLabel}
        </button>
      )}
    </fieldset>
  );
}

export function StepForm({ step, card, update }: { step: StepKey; card: Card; update: Update }) {
  switch (step) {
    case "identity": {
      const c = card.identity;
      return (
        <>
          <Text label="이름" required value={c.name} max={LIMITS.name} onChange={(v) => update((d) => void (d.identity.name = v))} hint="목록과 대화에 나가는 이름. 발행 뒤에는 다른 캐릭터와 겹칠 수 없습니다." />
          <Text label="한 줄 소개" required value={c.oneLiner} max={LIMITS.oneLiner} onChange={(v) => update((d) => void (d.identity.oneLiner = v))} placeholder="골목 끝 카페를 혼자 꾸리는 바리스타" />
          <Choice label="캠페인 역할" required value={c.role} options={ROLE_OPTIONS} onChange={(v) => update((d) => void (d.identity.role = v))} />
          <div className={styles.row}>
            <Text label="종족/직업" value={c.occupation} max={LIMITS.short} onChange={(v) => update((d) => void (d.identity.occupation = v))} />
            <Text label="겉보기 나이" value={c.apparentAge} max={LIMITS.short} onChange={(v) => update((d) => void (d.identity.apparentAge = v))} placeholder="30대 초반" />
          </div>
          <Lines label="태그" value={c.tags} maxItems={LIMITS.tags} maxLen={LIMITS.tag} onChange={(v) => update((d) => void (d.identity.tags = v))} />
        </>
      );
    }
    case "appearance": {
      const c = card.appearance;
      return (
        <>
          <Text label="외형 서술" rows={4} value={c.description} max={LIMITS.description} onChange={(v) => update((d) => void (d.appearance.description = v))} hint="모델이 장면을 묘사할 때 쓰는 서술입니다. 초상 이미지는 v1 범위 밖이에요." />
          <Lines label="분위기 키워드" value={c.keywords} maxItems={LIMITS.keywords} maxLen={LIMITS.keyword} onChange={(v) => update((d) => void (d.appearance.keywords = v))} />
        </>
      );
    }
    case "personality": {
      const c = card.personality;
      return (
        <>
          <fieldset className={styles.field}>
            <legend className={styles.label}>성격 축</legend>
            <p className={styles.hint}>긴 성격 설명 대신 축 + 규칙 + 습관으로 쪼갭니다 (§6.2).</p>
            {AXES.map((a) => (
              <label key={a.key} className={styles.axis}>
                <span className={styles.axisName}>{a.label}</span>
                <span className={styles.axisEnd}>{a.low}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={c[a.key]}
                  onChange={(e) => update((d) => void (d.personality[a.key] = Number(e.target.value)))}
                />
                <span className={styles.axisEnd}>{a.high}</span>
                <span className={styles.axisValue}>{c[a.key]}</span>
              </label>
            ))}
          </fieldset>
          <Choice label="말투" required value={c.honorific} options={HONORIFIC_OPTIONS} onChange={(v) => update((d) => void (d.personality.honorific = v))} />
          <Text label="호칭 규칙" required value={c.addressing} max={LIMITS.addressing} onChange={(v) => update((d) => void (d.personality.addressing = v))} placeholder="손님이라 부르고, 단골이 되면 이름 뒤에 씨를 붙인다" hint="대화 상태설정에서 유저가 호칭을 정하면 그쪽이 우선합니다." />
          <Lines label="말투 습관" required value={c.habits} maxItems={LIMITS.habits} maxLen={LIMITS.item} onChange={(v) => update((d) => void (d.personality.habits = v))} placeholder="말끝을 살짝 흐린다" />
          <Lines label="금지 말투" value={c.forbidden} maxItems={LIMITS.forbidden} maxLen={LIMITS.item} onChange={(v) => update((d) => void (d.personality.forbidden = v))} placeholder="인터넷 말투" />
          <Text label="성격 요약" required rows={2} value={c.summary} max={LIMITS.summary} onChange={(v) => update((d) => void (d.personality.summary = v))} />
        </>
      );
    }
    case "campaign": {
      const c = card.campaign;
      const t = (label: string, key: keyof Card["campaign"], required = false, hint?: string) => (
        <Text label={label} required={required} rows={2} value={c[key]} max={LIMITS.field} hint={hint} onChange={(v) => update((d) => void (d.campaign[key] = v))} />
      );
      return (
        <>
          <p className={styles.stepNote}>일반 캐릭터챗에 없는 칸입니다. 이 단계가 비면 캠페니언이 아니라 그냥 캐릭터챗이 됩니다.</p>
          {t("시작 장면", "scene", true)}
          {t("아는 것", "knows", true)}
          {t("모르는 것", "unknown", false, "캐릭터가 모르는 것. 물어보면 모른다고 답하게 됩니다.")}
          {t("목표", "goal", true)}
          {t("유저에게 거는 태도", "stance")}
          {t("갈등 씨앗", "conflictSeed", false, "비밀과 갈등 씨앗이 둘 다 비면 캠페인 밀도 경고가 뜹니다.")}
        </>
      );
    }
    case "boundary": {
      const c = card.boundary;
      return (
        <>
          <p className={styles.stepNote}>비밀과 해금 조건은 서버에만 남습니다. 모델에도, 페르소나 지식 파일에도 들어가지 않습니다.</p>
          <Text label="비밀" rows={2} value={c.secret} max={LIMITS.field} onChange={(v) => update((d) => void (d.boundary.secret = v))} />
          <Text label="해금 조건" required={c.secret.trim() !== ""} rows={2} value={c.unlockCondition} max={LIMITS.field} onChange={(v) => update((d) => void (d.boundary.unlockCondition = v))} hint="비밀은 항상 해금 조건과 쌍입니다. 조건 없는 비밀은 언젠가 먼저 말해집니다." />
          <Lines label="절대 하지 않는 것" value={c.neverDo} maxItems={LIMITS.neverDo} maxLen={LIMITS.item} onChange={(v) => update((d) => void (d.boundary.neverDo = v))} placeholder="AI라고 말하기" />
          <Text label="관계가 깨지는 것" rows={2} value={c.breakers} max={LIMITS.field} onChange={(v) => update((d) => void (d.boundary.breakers = v))} />
        </>
      );
    }
    case "greeting": {
      const c = card.greeting;
      return (
        <>
          <Text label="첫 메시지" required rows={5} value={c.firstMessage} max={LIMITS.firstMessage} onChange={(v) => update((d) => void (d.greeting.firstMessage = v))} hint="자기소개 대신 상황 2~4줄 + 대사 1~2줄. 대화를 열면 이 메시지가 처음 보입니다." />
          <Lines label="대체 인사" value={c.alternates} maxItems={LIMITS.alternates} maxLen={LIMITS.firstMessage} onChange={(v) => update((d) => void (d.greeting.alternates = v))} hint="한 줄에 하나씩, 2개까지" />
          <Pairs
            label="예시 대화"
            items={c.examples}
            max={LIMITS.examples}
            keys={[
              { key: "user", label: "유저 말", max: LIMITS.exampleLine },
              { key: "character", label: "캐릭터 답", max: LIMITS.exampleLine },
            ]}
            onChange={(v) => update((d) => void (d.greeting.examples = v))}
            hint="말투 예시로 검색돼 대화에 들어갑니다."
            addLabel="예시 대화 추가"
          />
        </>
      );
    }
    case "lore": {
      const c = card.lore;
      return (
        <>
          <Text label="세계 규칙" rows={3} value={c.world} max={LIMITS.lore} onChange={(v) => update((d) => void (d.lore.world = v))} />
          <Text label="중요 인물" rows={3} value={c.person} max={LIMITS.lore} onChange={(v) => update((d) => void (d.lore.person = v))} />
          <Text label="금기" rows={3} value={c.taboo} max={LIMITS.lore} onChange={(v) => update((d) => void (d.lore.taboo = v))} />
          <Pairs
            label="추가 로어"
            items={c.extra}
            max={LIMITS.extra}
            keys={[
              { key: "title", label: "제목", max: LIMITS.extraTitle, rows: 1 },
              { key: "text", label: "본문", max: LIMITS.lore, rows: 3 },
            ]}
            onChange={(v) => update((d) => void (d.lore.extra = v))}
            hint="관련 있는 대화에서만 검색돼 들어갑니다. 길게 써도 매 턴 무거워지지 않아요."
            addLabel="로어 추가"
          />
        </>
      );
    }
  }
}
