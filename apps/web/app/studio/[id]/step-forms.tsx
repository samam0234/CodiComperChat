"use client";

import { useContext, useId, useState, type ReactNode } from "react";
import { draftQuest } from "@/app/actions/studio";
import {
  AXES,
  HONORIFIC_OPTIONS,
  limitsFor,
  QUEST_TITLE_MAX,
  ROLE_OPTIONS,
  type Card,
  type Quest,
  type StepKey,
} from "@/lib/studio-card";
import { AiDraftButton, AiDraftPanel, DraftToolsContext, useAiDraft } from "./ai-draft";
import PromptExtendButton from "./prompt-extend";
import SampleReplies from "./sample-replies";
import styles from "./studio-editor.module.css";

export type Update = (mutate: (card: Card) => void) => void;

function Field({
  label,
  hint,
  required,
  count,
  max,
  extendable,
  aiKey,
  hasContent,
  onApplyAi,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  count?: number;
  max?: number;
  // 긴 글 칸이면 "프롬프트 연장"(프로 등급 안내)을 붙인다
  extendable?: boolean;
  // "이 칸만 AI로 초안" 대상 칸의 키(서버 목록과 같다). 비밀·해금 조건·예시 대화에는 주지 않는다
  aiKey?: string;
  hasContent?: boolean;
  onApplyAi?: (value: string | string[]) => void;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  const draft = useAiDraft(aiKey);
  const pro = (useContext(DraftToolsContext)?.multiplier ?? 1) > 1;
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
            {/* 프로 등급은 이미 3배 상한이라 연장 버튼 대신 표시만 한다 */}
            {extendable && (pro ? <span className={styles.proBadge} title="프로 등급: 글자 수 3배">프로 ×3</span> : <PromptExtendButton label={label} max={max} />)}
            {aiKey && <AiDraftButton label={label} draft={draft} />}
          </span>
        )}
      </div>
      {children(id)}
      {aiKey && onApplyAi && <AiDraftPanel label={label} draft={draft} hasContent={!!hasContent} onApply={onApplyAi} />}
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
  aiKey,
}: {
  label: string;
  value: string;
  max: number;
  onChange: (v: string) => void;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  aiKey?: string;
}) {
  return (
    <Field
      label={label}
      hint={hint}
      required={required}
      count={value.length}
      max={max}
      extendable={rows !== undefined}
      aiKey={aiKey}
      hasContent={value.trim() !== ""}
      onApplyAi={(v) => onChange(String(v))}
    >
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
  aiKey,
}: {
  label: string;
  value: string[];
  maxItems: number;
  maxLen: number;
  onChange: (v: string[]) => void;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  aiKey?: string;
}) {
  const filled = value.filter((v) => v.trim() !== "").length;
  return (
    <Field
      label={label}
      hint={hint ?? `한 줄에 하나씩, ${maxItems}개까지 (각 ${maxLen}자)`}
      required={required}
      count={filled}
      max={maxItems}
      aiKey={aiKey}
      hasContent={filled > 0}
      onApplyAi={(v) => onChange(Array.isArray(v) ? v : [v])}
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

// 말투 샘플이 서버에 저장된 카드로 답하므로, 초안 id와 "먼저 저장" 함수를 받는다
export type SampleProps = { draftId: string; ensureSaved: () => Promise<boolean>; multiplier: number };

export function StepForm(props: { step: StepKey; card: Card; update: Update; samples: SampleProps }) {
  return (
    <DraftToolsContext.Provider value={props.samples}>
      <StepFormBody {...props} />
    </DraftToolsContext.Provider>
  );
}

function StepFormBody({
  step,
  card,
  update,
  samples,
}: {
  step: StepKey;
  card: Card;
  update: Update;
  samples: SampleProps;
}) {
  // 요금 등급에 맞는 글자 수 상한 (프로는 긴 글 칸이 3배)
  const LIMITS = limitsFor(samples.multiplier);
  switch (step) {
    case "identity": {
      const c = card.identity;
      return (
        <>
          <Text label="이름" required value={c.name} max={LIMITS.name} onChange={(v) => update((d) => void (d.identity.name = v))} hint="목록과 대화에 나가는 이름. 발행 뒤에는 다른 캐릭터와 겹칠 수 없습니다." />
          <Text label="한 줄 소개" aiKey="identity.oneLiner" required value={c.oneLiner} max={LIMITS.oneLiner} onChange={(v) => update((d) => void (d.identity.oneLiner = v))} placeholder="골목 끝 카페를 혼자 꾸리는 바리스타" />
          <Choice label="캠페인 역할" required value={c.role} options={ROLE_OPTIONS} onChange={(v) => update((d) => void (d.identity.role = v))} />
          <div className={styles.row}>
            <Text label="종족/직업" value={c.occupation} max={LIMITS.short} onChange={(v) => update((d) => void (d.identity.occupation = v))} />
            <Text label="겉보기 나이" value={c.apparentAge} max={LIMITS.short} onChange={(v) => update((d) => void (d.identity.apparentAge = v))} placeholder="30대 초반" />
          </div>
          <Lines label="태그" aiKey="identity.tags" value={c.tags} maxItems={LIMITS.tags} maxLen={LIMITS.tag} onChange={(v) => update((d) => void (d.identity.tags = v))} />
        </>
      );
    }
    case "appearance": {
      const c = card.appearance;
      return (
        <>
          <Text label="외형 서술" aiKey="appearance.description" rows={4} value={c.description} max={LIMITS.description} onChange={(v) => update((d) => void (d.appearance.description = v))} hint="모델이 장면을 묘사할 때 쓰는 서술입니다. 초상 이미지는 v1 범위 밖이에요." />
          <Lines label="분위기 키워드" aiKey="appearance.keywords" value={c.keywords} maxItems={LIMITS.keywords} maxLen={LIMITS.keyword} onChange={(v) => update((d) => void (d.appearance.keywords = v))} />
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
          <Text label="호칭 규칙" aiKey="personality.addressing" required value={c.addressing} max={LIMITS.addressing} onChange={(v) => update((d) => void (d.personality.addressing = v))} placeholder="손님이라 부르고, 단골이 되면 이름 뒤에 씨를 붙인다" hint="대화 상태설정에서 유저가 호칭을 정하면 그쪽이 우선합니다." />
          <Lines label="말투 습관" aiKey="personality.habits" required value={c.habits} maxItems={LIMITS.habits} maxLen={LIMITS.item} onChange={(v) => update((d) => void (d.personality.habits = v))} placeholder="말끝을 살짝 흐린다" />
          <Lines label="금지 말투" aiKey="personality.forbidden" value={c.forbidden} maxItems={LIMITS.forbidden} maxLen={LIMITS.item} onChange={(v) => update((d) => void (d.personality.forbidden = v))} placeholder="인터넷 말투" />
          <Text label="성격 요약" aiKey="personality.summary" required rows={2} value={c.summary} max={LIMITS.summary} onChange={(v) => update((d) => void (d.personality.summary = v))} />
          <SampleReplies
            draftId={samples.draftId}
            ready={card.identity.name.trim() !== "" && card.personality.honorific !== ""}
            ensureSaved={samples.ensureSaved}
          />
        </>
      );
    }
    case "campaign": {
      const c = card.campaign;
      const t = (label: string, key: keyof Card["campaign"], required = false, hint?: string) => (
        <Text label={label} aiKey={`campaign.${key}`} required={required} rows={2} value={c[key]} max={LIMITS.field} hint={hint} onChange={(v) => update((d) => void (d.campaign[key] = v))} />
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
          <Lines label="절대 하지 않는 것" aiKey="boundary.neverDo" value={c.neverDo} maxItems={LIMITS.neverDo} maxLen={LIMITS.item} onChange={(v) => update((d) => void (d.boundary.neverDo = v))} placeholder="AI라고 말하기" />
          <Text label="관계가 깨지는 것" aiKey="boundary.breakers" rows={2} value={c.breakers} max={LIMITS.field} onChange={(v) => update((d) => void (d.boundary.breakers = v))} />
        </>
      );
    }
    case "greeting": {
      const c = card.greeting;
      return (
        <>
          <Text label="첫 메시지" aiKey="greeting.firstMessage" required rows={5} value={c.firstMessage} max={LIMITS.firstMessage} onChange={(v) => update((d) => void (d.greeting.firstMessage = v))} hint="자기소개 대신 상황 2~4줄 + 대사 1~2줄. 대화를 열면 이 메시지가 처음 보입니다." />
          <Lines label="대체 인사" aiKey="greeting.alternates" value={c.alternates} maxItems={LIMITS.alternates} maxLen={LIMITS.firstMessage} onChange={(v) => update((d) => void (d.greeting.alternates = v))} hint="한 줄에 하나씩, 2개까지" />
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
    case "quest": {
      return <QuestStep card={card} update={update} samples={samples} max={LIMITS.field} />;
    }
    case "lore": {
      const c = card.lore;
      return (
        <>
          <Text label="세계 규칙" aiKey="lore.world" rows={3} value={c.world} max={LIMITS.lore} onChange={(v) => update((d) => void (d.lore.world = v))} />
          <Text label="중요 인물" aiKey="lore.person" rows={3} value={c.person} max={LIMITS.lore} onChange={(v) => update((d) => void (d.lore.person = v))} />
          <Text label="금기" aiKey="lore.taboo" rows={3} value={c.taboo} max={LIMITS.lore} onChange={(v) => update((d) => void (d.lore.taboo = v))} />
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

// 비밀 퀘스트 단계: 직접 쓰거나, AI가 카드 설정을 읽고 한 번에 만든 제안을 적용한 뒤 고친다. 칸마다 "AI 초안"도 된다.
// 캐릭터가 친해진 뒤 건네는 숨은 미션이다 — 달성 조건은 캐릭터에게 알려지지 않고, 이야기 정리 때 판정에만 쓰인다
type QuestDraft =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; quest: Quest }
  | { status: "error"; message: string };

function QuestStep({ card, update, samples, max }: { card: Card; update: Update; samples: SampleProps; max: number }) {
  const q = card.quest;
  const [draft, setDraft] = useState<QuestDraft>({ status: "idle" });
  const has = q.title !== "" || q.offer !== "" || q.objective !== "" || q.reward !== "";

  const generate = async () => {
    setDraft({ status: "loading" });
    // 서버가 저장된 카드로 만들므로 먼저 저장을 끝낸다
    if (!(await samples.ensureSaved())) {
      setDraft({ status: "error", message: "카드를 저장하지 못해 퀘스트를 만들 수 없습니다. 위의 저장 오류를 먼저 고쳐 주세요." });
      return;
    }
    const result = await draftQuest(samples.draftId);
    setDraft(result.ok ? { status: "ready", quest: result.data } : { status: "error", message: result.error });
  };

  return (
    <>
      <p className={styles.stepNote}>
        친밀도가 쌓이면 캐릭터가 먼저 건네는 숨은 부탁입니다. 건네기 전에는 유저에게 제목도 내용도 보이지 않아요. 직접 쓰거나 AI로 한 번에 만들 수 있고, 안 써도 발행됩니다.
      </p>

      <div className={styles.field}>
        <div className={styles.aiActions}>
          <button type="button" className={styles.secondary} onClick={() => void generate()} disabled={draft.status === "loading"}>
            {draft.status === "loading" ? "만드는 중…" : "AI로 퀘스트 만들기"}
          </button>
          {has && (
            <button
              type="button"
              className={styles.textButton}
              onClick={() => update((d) => void (d.quest = { title: "", offer: "", objective: "", reward: "", unlockAt: 30 }))}
            >
              퀘스트 지우기
            </button>
          )}
        </div>
        <p className={styles.hint}>캐릭터 설정(이름·성격·목표 등)을 읽고 한 번에 제안해요. 비밀·해금 조건은 AI에 보내지 않습니다.</p>
      </div>

      {draft.status === "error" && (
        <p className={styles.errorText} role="alert">
          {draft.message}
        </p>
      )}
      {draft.status === "ready" && (
        <div className={styles.aiPanel} role="group" aria-label="AI 퀘스트 제안">
          <p className={styles.aiTitle}>AI 퀘스트 제안</p>
          <div className={styles.aiPreview}>
            <p><strong>{draft.quest.title}</strong> (친밀도 {draft.quest.unlockAt} 이상)</p>
            <p>부탁: {draft.quest.offer}</p>
            <p>달성 조건: {draft.quest.objective}</p>
            {draft.quest.reward && <p>보상 장면: {draft.quest.reward}</p>}
          </div>
          <p className={styles.hint}>{has ? "적용하면 지금 쓴 퀘스트가 이것으로 바뀝니다. " : ""}적용한 뒤 칸마다 고쳐 쓸 수 있어요.</p>
          <div className={styles.aiActions}>
            <button type="button" className={styles.textButton} onClick={() => setDraft({ status: "idle" })}>
              닫기
            </button>
            <button type="button" className={styles.secondary} onClick={() => void generate()}>
              다시 만들기
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                const next = draft.quest;
                update((d) => void (d.quest = { ...next }));
                setDraft({ status: "idle" });
              }}
            >
              적용하기
            </button>
          </div>
        </div>
      )}

      <Text label="퀘스트 이름" aiKey="quest.title" value={q.title} max={QUEST_TITLE_MAX} onChange={(v) => update((d) => void (d.quest.title = v))} placeholder="접어 둔 문제집" hint="건네받은 뒤에야 유저에게 보입니다." />
      <Text label="퀘스트 부탁" aiKey="quest.offer" rows={3} value={q.offer} max={max} onChange={(v) => update((d) => void (d.quest.offer = v))} hint="캐릭터가 무엇을 어떻게 부탁하는지. 이 캐릭터의 약점이나 목표에서 나오는 이야기 속 부탁으로 쓰세요." />
      <Text label="퀘스트 달성 조건" aiKey="quest.objective" rows={3} value={q.objective} max={max} onChange={(v) => update((d) => void (d.quest.objective = v))} hint="유저가 대화에서 무엇을 하면 해낸 것인지. 대화 기록만 보고 판정할 수 있게 구체적인 행동·말로 쓰세요. 캐릭터에게는 알려지지 않습니다." />
      <Text label="퀘스트 보상 장면" aiKey="quest.reward" rows={3} value={q.reward} max={max} onChange={(v) => update((d) => void (d.quest.reward = v))} hint="해냈을 때 캐릭터가 보이는 변화나 장면(선택). 코레딧 보상은 공식 캐릭터에만 있어요." />
      <label className={styles.axis}>
        <span className={styles.axisName}>열리는 친밀도</span>
        <span className={styles.axisEnd}>낮음</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={q.unlockAt}
          aria-label="퀘스트가 열리는 친밀도"
          onChange={(e) => update((d) => void (d.quest.unlockAt = Number(e.target.value)))}
        />
        <span className={styles.axisEnd}>높음</span>
        <span className={styles.axisValue}>{q.unlockAt}</span>
      </label>
    </>
  );
}
