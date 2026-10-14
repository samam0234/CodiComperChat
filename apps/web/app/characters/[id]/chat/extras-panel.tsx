"use client";

import { useEffect, useId, useState } from "react";
import {
  applyExtra,
  createExtra,
  deleteExtra,
  loadExtras,
  unapplyExtra,
  updateExtra,
} from "@/app/actions/extras";
import ChoiceDialog from "@/components/choice-dialog";
import { EMPTY_EXTRA, TRIGGER_OPTIONS, type Extra, type ExtraFields, type ExtrasView, type Trigger } from "@/lib/extras";
import styles from "./extras-panel.module.css";

const FIELDS: { key: keyof ExtraFields; label: string; hint?: string; rows?: number; required?: boolean }[] = [
  { key: "name", label: "이름", required: true },
  { key: "summary", label: "한 줄 소개", required: true, hint: "예: 유지성의 여동생, 고등학교 1학년" },
  { key: "personality", label: "성격·말투", rows: 2, hint: "예: 밝고 수다스럽다. 오빠에게 반말" },
  { key: "relation", label: "인물 관계", rows: 2, hint: "주인공 캐릭터나 나와의 관계. 예: 유지성의 여동생" },
  { key: "situation", label: "등장 상황", rows: 2, hint: "예: 시험 기간, 늦은 밤 공부" },
  { key: "place", label: "등장 장소", hint: "예: 스터디카페, 집" },
];

// 조건 체크: "모두"는 세 조건을 한꺼번에 켜고 끈다
function TriggerPicker({
  extra,
  value,
  onChange,
}: {
  extra: Extra;
  value: Trigger[];
  onChange: (v: Trigger[]) => void;
}) {
  const available = TRIGGER_OPTIONS.filter((o) => extra[o.field].trim() !== "").map((o) => o.value);
  const all = available.length > 0 && available.every((t) => value.includes(t));
  return (
    <fieldset className={styles.triggers}>
      <legend className={styles.label}>등장 조건</legend>
      {TRIGGER_OPTIONS.map((o) => {
        const disabled = !available.includes(o.value);
        return (
          <label key={o.value} className={disabled ? styles.checkDisabled : styles.check} title={disabled ? `${o.label} 칸이 비어 있어요` : undefined}>
            <input
              type="checkbox"
              checked={value.includes(o.value)}
              disabled={disabled}
              onChange={(e) =>
                onChange(e.target.checked ? [...value, o.value] : value.filter((t) => t !== o.value))
              }
            />
            {o.label}
          </label>
        );
      })}
      <label className={available.length === 0 ? styles.checkDisabled : styles.check}>
        <input
          type="checkbox"
          checked={all}
          disabled={available.length === 0}
          onChange={(e) => onChange(e.target.checked ? available : [])}
        />
        모두
      </label>
      {available.length < TRIGGER_OPTIONS.length && (
        <p className={styles.hint}>칸이 비어 있는 조건은 고를 수 없어요. 엑스트라를 고쳐 채우면 고를 수 있습니다.</p>
      )}
    </fieldset>
  );
}

// 쓸 수 있는 조건(칸이 채워진 것)을 다 골랐으면 "모두"
function triggerLabel(extra: Extra, triggers: Trigger[]): string {
  const available = TRIGGER_OPTIONS.filter((o) => extra[o.field].trim() !== "");
  const names = TRIGGER_OPTIONS.filter((o) => triggers.includes(o.value)).map((o) => o.label);
  return available.length > 1 && available.every((o) => triggers.includes(o.value))
    ? `조건: 모두 (${names.join("·")})`
    : `조건: ${names.join(", ")}`;
}

function Keywords({ extra, triggers }: { extra: Extra; triggers: Trigger[] }) {
  const words = triggers.flatMap((t) => extra.keywords[t]);
  return (
    <p className={styles.keywords}>
      이런 말이 나오면 등장: {words.length > 0 ? words.join(" · ") : "(조건 단어 없음)"} · 이름 &apos;{extra.name}&apos;을(를) 부르면 언제든
    </p>
  );
}

export default function ExtrasPanel({ characterId, characterName }: { characterId: string; characterName: string }) {
  const formId = useId();
  const [view, setView] = useState<ExtrasView | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 적용하기
  const [pickId, setPickId] = useState("");
  const [pickTriggers, setPickTriggers] = useState<Trigger[]>([]);
  // 적용한 것의 조건 바꾸기
  const [editingApplied, setEditingApplied] = useState<{ extraId: string; triggers: Trigger[] } | null>(null);
  // 만들기·고치기 폼 (id가 null이면 새로 만들기)
  const [form, setForm] = useState<{ id: string | null; fields: ExtraFields } | null>(null);
  const [deleting, setDeleting] = useState<Extra | null>(null);

  // 이 컴포넌트는 대화가 바뀔 때(새로하기) 새로 그려져 지금 대화의 엑스트라를 다시 불러온다
  useEffect(() => {
    let alive = true;
    void loadExtras(characterId).then((r) => {
      if (!alive) return;
      if (r.ok) setView(r.data);
      else setError(r.error);
    });
    return () => {
      alive = false;
    };
  }, [characterId]);

  const run = async <T,>(action: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>) => {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    return result.data;
  };

  const reload = async () => {
    const r = await loadExtras(characterId);
    if (r.ok) setView(r.data);
  };

  if (!view) {
    return (
      <section className={styles.panel} aria-label="엑스트라 설정">
        <p className={styles.hint}>{error ?? "엑스트라 설정을 불러오는 중…"}</p>
      </section>
    );
  }

  const byId = new Map(view.mine.map((e) => [e.id, e]));
  const appliedIds = new Set(view.applied.map((a) => a.extraId));
  const candidates = view.mine.filter((e) => !appliedIds.has(e.id));
  const picked = byId.get(pickId);
  const full = view.applied.length >= view.limits.perConversation;

  const apply = async () => {
    if (!picked || pickTriggers.length === 0) return;
    const data = await run(() => applyExtra(characterId, picked.id, pickTriggers));
    if (data) {
      setView(data);
      setPickId("");
      setPickTriggers([]);
    }
  };

  const saveForm = async () => {
    if (!form) return;
    const data = await run(() =>
      form.id ? updateExtra(characterId, form.id, form.fields) : createExtra(characterId, form.fields),
    );
    if (data) {
      setForm(null);
      await reload();
    }
  };

  return (
    <section className={styles.panel} aria-labelledby={`${formId}-title`}>
      <button
        type="button"
        className={styles.head}
        aria-expanded={open}
        aria-controls={`${formId}-body`}
        onClick={() => setOpen((v) => !v)}
      >
        <span id={`${formId}-title`} className={styles.title}>
          엑스트라 설정
        </span>
        <span className={styles.badge}>
          적용 {view.applied.length}/{view.limits.perConversation}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div id={`${formId}-body`} className={styles.body}>
          <p className={styles.intro}>
            내가 만든 조연을 이 대화에 등장시킵니다. 고른 조건의 말이 대화에 나올 때만 {characterName}와 함께 등장하고, 적어 둔
            것 밖의 사실은 지어내지 않아요. 이 대화에만 적용되며, 새로하기를 하면 새 대화에는 없습니다.
          </p>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <h3 className={styles.subTitle}>이 대화에 적용한 엑스트라</h3>
          {view.applied.length === 0 ? (
            <p className={styles.hint}>아직 없어요.</p>
          ) : (
            <ul className={styles.list}>
              {view.applied.map((a) => {
                const extra = byId.get(a.extraId);
                if (!extra) return null;
                const editing = editingApplied?.extraId === a.extraId;
                return (
                  <li key={a.extraId} className={styles.item}>
                    <div className={styles.itemHead}>
                      <span className={styles.itemName}>{extra.name}</span>
                      <span className={styles.itemSummary}>{extra.summary}</span>
                    </div>
                    {editing ? (
                      <>
                        <TriggerPicker
                          extra={extra}
                          value={editingApplied.triggers}
                          onChange={(triggers) => setEditingApplied({ extraId: a.extraId, triggers })}
                        />
                        <div className={styles.row}>
                          <button type="button" className={styles.secondary} onClick={() => setEditingApplied(null)} disabled={busy}>
                            취소
                          </button>
                          <button
                            type="button"
                            className={styles.primary}
                            disabled={busy || editingApplied.triggers.length === 0}
                            onClick={async () => {
                              const data = await run(() => applyExtra(characterId, a.extraId, editingApplied.triggers));
                              if (data) {
                                setView(data);
                                setEditingApplied(null);
                              }
                            }}
                          >
                            조건 저장
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className={styles.chips}>{triggerLabel(extra, a.triggers)}</p>
                        <Keywords extra={extra} triggers={a.triggers} />
                        <div className={styles.row}>
                          <button
                            type="button"
                            className={styles.textButton}
                            onClick={() => setEditingApplied({ extraId: a.extraId, triggers: a.triggers })}
                            disabled={busy}
                          >
                            조건 바꾸기
                          </button>
                          <button
                            type="button"
                            className={styles.textButton}
                            onClick={async () => {
                              const data = await run(() => unapplyExtra(characterId, a.extraId));
                              if (data) setView(data);
                            }}
                            disabled={busy}
                          >
                            이 대화에서 빼기
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <h3 className={styles.subTitle}>적용하기</h3>
          {view.mine.length === 0 ? (
            <p className={styles.hint}>먼저 아래에서 엑스트라를 만들어 주세요.</p>
          ) : full ? (
            <p className={styles.hint}>한 대화에는 {view.limits.perConversation}명까지 적용할 수 있어요.</p>
          ) : candidates.length === 0 ? (
            <p className={styles.hint}>내 엑스트라를 모두 적용했어요.</p>
          ) : (
            <div className={styles.applyBox}>
              <label className={styles.field}>
                <span className={styles.label}>엑스트라</span>
                <select
                  className={styles.select}
                  value={pickId}
                  onChange={(e) => {
                    setPickId(e.target.value);
                    setPickTriggers([]);
                  }}
                >
                  <option value="">고르세요</option>
                  {candidates.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} — {e.summary}
                    </option>
                  ))}
                </select>
              </label>
              {picked && (
                <>
                  <TriggerPicker extra={picked} value={pickTriggers} onChange={setPickTriggers} />
                  {pickTriggers.length > 0 && <Keywords extra={picked} triggers={pickTriggers} />}
                </>
              )}
              <button
                type="button"
                className={styles.primary}
                onClick={() => void apply()}
                disabled={busy || !picked || pickTriggers.length === 0}
              >
                이 대화에 적용
              </button>
            </div>
          )}

          <div className={styles.mineHead}>
            <h3 className={styles.subTitle}>
              내 엑스트라 <span className={styles.count}>{view.mine.length}/{view.limits.perUser}</span>
            </h3>
            {!form && view.mine.length < view.limits.perUser && (
              <button type="button" className={styles.secondary} onClick={() => setForm({ id: null, fields: { ...EMPTY_EXTRA } })}>
                + 새 엑스트라
              </button>
            )}
          </div>

          {form && (
            <div className={styles.form}>
              <p className={styles.formTitle}>{form.id ? "엑스트라 고치기" : "새 엑스트라"}</p>
              {FIELDS.map((f) => {
                const max = view.limits[f.key];
                const value = form.fields[f.key];
                return (
                  <label key={f.key} className={styles.field}>
                    <span className={styles.fieldHead}>
                      <span className={styles.label}>
                        {f.label}
                        {f.required && <span className={styles.required}> 필수</span>}
                      </span>
                      <span className={styles.count}>
                        {value.length}/{max}
                      </span>
                    </span>
                    {f.rows ? (
                      <textarea
                        className={styles.textarea}
                        rows={f.rows}
                        maxLength={max}
                        value={value}
                        onChange={(e) => setForm({ ...form, fields: { ...form.fields, [f.key]: e.target.value } })}
                      />
                    ) : (
                      <input
                        className={styles.input}
                        maxLength={max}
                        value={value}
                        onChange={(e) => setForm({ ...form, fields: { ...form.fields, [f.key]: e.target.value } })}
                      />
                    )}
                    {f.hint && <span className={styles.hint}>{f.hint}</span>}
                  </label>
                );
              })}
              <p className={styles.hint}>
                인물 관계·등장 상황·등장 장소 중 쓴 칸만 등장 조건으로 고를 수 있어요. 적은 것만 사실로 다루니, 꼭 알아야 할 설정은
                칸에 적어 주세요.
              </p>
              <div className={styles.row}>
                <button type="button" className={styles.secondary} onClick={() => setForm(null)} disabled={busy}>
                  취소
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => void saveForm()}
                  disabled={busy || form.fields.name.trim() === "" || form.fields.summary.trim() === ""}
                >
                  {form.id ? "저장" : "만들기"}
                </button>
              </div>
            </div>
          )}

          {view.mine.length > 0 && (
            <ul className={styles.list}>
              {view.mine.map((e) => (
                <li key={e.id} className={styles.mineItem}>
                  <span className={styles.itemName}>{e.name}</span>
                  <span className={styles.itemSummary}>{e.summary}</span>
                  <span className={styles.mineActions}>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() =>
                        setForm({
                          id: e.id,
                          fields: {
                            name: e.name,
                            summary: e.summary,
                            personality: e.personality,
                            relation: e.relation,
                            situation: e.situation,
                            place: e.place,
                          },
                        })
                      }
                      disabled={busy}
                    >
                      고치기
                    </button>
                    <button type="button" className={styles.dangerText} onClick={() => setDeleting(e)} disabled={busy}>
                      지우기
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ChoiceDialog
        open={deleting !== null}
        title="엑스트라를 지울까요?"
        onClose={() => setDeleting(null)}
        busy={busy}
        choices={[
          { label: "취소", onSelect: () => setDeleting(null) },
          {
            label: "지우기",
            tone: "danger",
            onSelect: async () => {
              if (!deleting) return;
              const target = deleting;
              setBusy(true);
              const result = await deleteExtra(characterId, target.id);
              setBusy(false);
              setDeleting(null);
              if (result.ok) await reload();
              else setError(result.error);
            },
          },
        ]}
      >
        적용해 둔 모든 대화(저장한 대화 포함)에서도 빠집니다.
      </ChoiceDialog>
    </section>
  );
}
