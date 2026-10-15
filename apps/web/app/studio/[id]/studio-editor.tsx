"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteDraft, publishDraft, saveDraft, setDraftVisibility, unpublishDraft } from "@/app/actions/studio";
import { VISIBILITY_OPTIONS, type Card, type DraftView, type StepKey, type Visibility } from "@/lib/studio-card";
import { StepForm, type Update } from "./step-forms";
import PortraitUploader from "./portrait-uploader";
import TestPanel from "./test-panel";
import styles from "./studio-editor.module.css";

// 입력을 멈추고 이만큼 지나면 저장한다. 저장 응답의 발행 준비 상태가 오른쪽 미리보기를 갱신한다
const AUTOSAVE_MS = 800;

type SaveState = "saved" | "dirty" | "saving" | "error";

export type Persona = { id: string; name: string };

export default function StudioEditor({
  initial,
  personas,
}: {
  initial: DraftView;
  personas: Persona[];
}) {
  const [card, setCard] = useState<Card>(initial.card);
  const [view, setView] = useState<DraftView>(initial);
  const [step, setStep] = useState<StepKey>("identity");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  // 초상은 카드와 따로 올라가므로 바뀔 때마다 미리보기 캐시를 새로 받게 값을 바꾼다
  const [portraitVersion, setPortraitVersion] = useState(initial.updatedAt);

  // 저장 중에 또 고치면, 저장이 끝난 뒤 최신 카드로 한 번 더 저장한다
  const latest = useRef(card);
  const savedVersion = useRef(0);
  const version = useRef(0);
  const inflight = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (): Promise<boolean> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inflight.current) await inflight.current;
    if (savedVersion.current === version.current) return true;

    const sending = version.current;
    setSaveState("saving");
    const run = (async () => {
      const result = await saveDraft(initial.id, latest.current);
      if (!result.ok) {
        setSaveState("error");
        setSaveError(result.error);
        return false;
      }
      savedVersion.current = sending;
      // 입력 중인 칸이 서버의 다듬기(앞뒤 공백 제거)로 바뀌지 않게, 카드는 덮어쓰지 않고 상태만 받는다
      setView(result.data);
      setSaveError(null);
      setSaveState(savedVersion.current === version.current ? "saved" : "dirty");
      return true;
    })();
    inflight.current = run;
    const ok = await run;
    inflight.current = null;
    return ok;
  }, [initial.id]);

  const update: Update = useCallback(
    (mutate) => {
      const next = structuredClone(latest.current);
      mutate(next);
      latest.current = next;
      version.current += 1;
      setCard(next);
      setSaveState("dirty");
      setPublishMessage(null);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), AUTOSAVE_MS);
    },
    [save],
  );

  // 저장 안 된 채 나가려 하면 붙잡는다
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (savedVersion.current !== version.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const r = view.readiness;
  const stepIndex = r.steps.findIndex((s) => s.key === step);
  const canPublish = r.complete && view.test.passed && saveState === "saved" && !view.takedown;
  const visibilityOption = VISIBILITY_OPTIONS.find((o) => o.value === view.visibility) ?? VISIBILITY_OPTIONS[2];
  const [copied, setCopied] = useState(false);

  // 공개 범위는 카드 지문과 무관해 다시 테스트할 필요 없다. 발행 중이면 바로 적용된다
  async function changeVisibility(visibility: Visibility) {
    setBusy(true);
    const result = await setDraftVisibility(initial.id, visibility);
    setBusy(false);
    if (result.ok) {
      setView((v) => ({ ...v, visibility: result.data.visibility }));
      setPublishMessage(
        result.data.published
          ? { ok: true, text: `공개 범위를 '${VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.label}'(으)로 바꿨습니다.` }
          : null,
      );
    } else {
      setPublishMessage({ ok: false, text: result.error });
    }
  }

  async function copyLink() {
    if (!view.characterId) return;
    const url = `${window.location.origin}/characters/${view.characterId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("이 링크를 복사하세요", url);
    }
  }

  async function publish() {
    if (!(await save())) return;
    setBusy(true);
    const result = await publishDraft(initial.id);
    setBusy(false);
    if (result.ok) {
      setView(result.data);
      setPublishMessage({
        ok: true,
        text:
          result.data.visibility === "PUBLIC"
            ? "발행했습니다. 홈의 캐릭터 목록에 올라갔어요."
            : result.data.visibility === "UNLISTED"
              ? "발행했습니다. 링크를 받은 사람만 대화할 수 있어요."
              : "발행했습니다. 나만 대화할 수 있어요.",
      });
    } else {
      setPublishMessage({ ok: false, text: result.error });
    }
  }

  async function unpublish() {
    if (!window.confirm("발행을 내릴까요? 목록과 새 대화에서 빠지고, 이미 나눈 대화 기록은 남습니다.")) return;
    setBusy(true);
    const result = await unpublishDraft(initial.id);
    setBusy(false);
    if (result.ok) {
      setView(result.data);
      setPublishMessage({ ok: true, text: "발행을 내렸습니다. 고쳐서 다시 발행할 수 있어요." });
    } else {
      setPublishMessage({ ok: false, text: result.error });
    }
  }

  async function remove() {
    if (!window.confirm("이 초안을 지울까요? 되돌릴 수 없습니다.")) return;
    // 지운 뒤 나가는 길에 "저장 안 됨" 확인이 뜨지 않게
    savedVersion.current = version.current;
    const result = await deleteDraft(initial.id);
    if (result && !result.ok) setPublishMessage({ ok: false, text: result.error });
  }

  const publishHint = view.takedown
    ? "운영자가 내린 캐릭터라 다시 발행할 수 없습니다."
    : !r.complete
      ? "필수 단계를 모두 채워야 합니다."
      : !view.test.passed
        ? "지금 카드로 테스트 3턴을 통과해야 합니다."
        : saveState !== "saved"
          ? "저장이 끝나면 발행할 수 있습니다."
          : view.published
            ? "고친 내용으로 다시 발행합니다."
            : `발행하면 ${visibilityOption.hint}`;

  return (
    <div className={styles.shell}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarTitle}>
          <Link href="/studio" className={styles.back}>
            ← 공방
          </Link>
          <h1 className={styles.title}>{card.identity.name.trim() || "이름 없는 초안"}</h1>
          {view.published && <span className={styles.publishedBadge}>발행됨 · {visibilityOption.label}</span>}
        </div>
        <div className={styles.toolbarActions}>
          <span className={saveState === "error" ? styles.saveError : styles.saveStatus} role="status">
            {saveState === "saving" ? "저장 중…" : saveState === "dirty" ? "저장 대기" : saveState === "error" ? "저장 실패" : "저장됨"}
          </span>
          <button type="button" className={styles.secondary} onClick={() => void save()} disabled={saveState === "saving"}>
            초안 저장
          </button>
          <button type="button" className={`${styles.secondary} ${styles.previewToggle}`} onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview}>
            {showPreview ? "폼 보기" : "미리보기"}
          </button>
          <label className={styles.visibility} title={visibilityOption.hint}>
            <span className={styles.srOnly}>공개 범위</span>
            <select
              value={view.visibility}
              onChange={(e) => void changeVisibility(e.target.value as Visibility)}
              disabled={busy}
              aria-describedby="visibility-hint"
            >
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {view.published && view.characterId && view.visibility !== "PRIVATE" && (
            <button type="button" className={styles.secondary} onClick={() => void copyLink()}>
              {copied ? "복사했어요" : "링크 복사"}
            </button>
          )}
          <button type="button" className={styles.primary} onClick={() => void publish()} disabled={!canPublish || busy} title={publishHint}>
            {view.published ? "다시 발행" : "발행"}
          </button>
        </div>
      </header>

      {view.takedown && (
        <p className={styles.errorBanner} role="alert">
          운영자가 이 캐릭터를 내렸습니다. 사유: {view.takedown.reason || "(사유 없음)"} — 홈·링크·대화에서 보이지 않고 다시 발행할 수
          없습니다. 문제가 해결되면 운영자가 복구할 수 있어요.
        </p>
      )}
      {saveError && (
        <p className={styles.errorBanner} role="alert">
          {saveError}
        </p>
      )}
      {publishMessage && (
        <p className={publishMessage.ok ? styles.okBanner : styles.errorBanner} role={publishMessage.ok ? "status" : "alert"}>
          {publishMessage.text}
          {publishMessage.ok && view.published && view.characterId && (
            <>
              {" "}
              <Link href={`/characters/${view.characterId}`} className={styles.inlineLink}>
                캐릭터 페이지 보기
              </Link>
            </>
          )}
        </p>
      )}

      <div className={styles.layout} data-preview={showPreview ? "on" : "off"}>
        <nav className={styles.steps} aria-label="공방 단계">
          <ol>
            {r.steps.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  className={s.key === step ? styles.stepOn : styles.step}
                  aria-current={s.key === step ? "step" : undefined}
                  onClick={(e) => {
                    setStep(s.key);
                    setShowPreview(false);
                    // 좁은 화면의 가로 단계 띠에서 고른 단계가 가려지지 않게
                    e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
                  }}
                >
                  <span className={s.done ? styles.stepDone : s.missing.length > 0 ? styles.stepTodo : styles.stepNum}>
                    {s.done ? "✓" : i + 1}
                  </span>
                  <span className={styles.stepLabel}>
                    {s.label}
                    {s.required && <span className={styles.stepRequired}>필수</span>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <section className={styles.form} aria-labelledby="step-title">
          <h2 id="step-title" className={styles.stepTitle}>
            {stepIndex + 1}. {r.steps[stepIndex]?.label}
          </h2>
          {r.steps[stepIndex]?.missing.length > 0 && (
            <p className={styles.missingLine}>비어 있는 필수 칸: {r.steps[stepIndex].missing.join(", ")}</p>
          )}
          {step === "appearance" && (
            <PortraitUploader
              draftId={initial.id}
              hasPortrait={view.hasPortrait}
              version={portraitVersion}
              onChange={(hasPortrait) => {
                setView((v) => ({ ...v, hasPortrait }));
                setPortraitVersion(String(Date.now()));
              }}
            />
          )}
          <StepForm step={step} card={card} update={update} samples={{ draftId: initial.id, ensureSaved: save }} />
          <div className={styles.stepNav}>
            <button type="button" className={styles.secondary} disabled={stepIndex <= 0} onClick={() => setStep(r.steps[stepIndex - 1].key)}>
              이전 단계
            </button>
            <button type="button" className={styles.secondary} disabled={stepIndex >= r.steps.length - 1} onClick={() => setStep(r.steps[stepIndex + 1].key)}>
              다음 단계
            </button>
          </div>
          <div className={styles.danger}>
            {view.published && (
              <button type="button" className={styles.textButton} onClick={() => void unpublish()} disabled={busy}>
                발행 내리기
              </button>
            )}
            {!view.published && (
              <button type="button" className={styles.dangerButton} onClick={() => void remove()}>
                초안 지우기
              </button>
            )}
          </div>
        </section>

        <aside className={styles.preview} aria-label="라이브 미리보기">
          <div className={styles.profile}>
            {view.hasPortrait && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.profileArt}
                src={`/api/studio/${encodeURIComponent(initial.id)}/portrait?v=${encodeURIComponent(portraitVersion)}`}
                alt="초상 미리보기"
                width={72}
                height={72}
              />
            )}
            <p className={styles.profileName}>{card.identity.name.trim() || "이름"}</p>
            <p className={styles.profileLine}>{card.identity.oneLiner.trim() || "한 줄 소개"}</p>
            {card.identity.tags.some((t) => t.trim()) && (
              <ul className={styles.tags}>
                {card.identity.tags.filter((t) => t.trim()).map((t) => (
                  <li key={t}>#{t.trim()}</li>
                ))}
              </ul>
            )}
            <p className={styles.tokens}>
              항상 들어가는 설정 약 <strong>{r.tokens}</strong> 토큰
            </p>
          </div>

          <div className={styles.checklist}>
            <p className={styles.panelTitle}>발행 준비</p>
            <ul>
              {r.steps
                .filter((s) => s.missing.length > 0)
                .map((s) => (
                  <li key={s.key} className={styles.checkTodo}>
                    <button type="button" className={styles.linkLike} onClick={() => setStep(s.key)}>
                      {s.label}
                    </button>
                    : {s.missing.join(", ")}
                  </li>
                ))}
              {r.complete && <li className={styles.checkOk}>필수 단계 완료</li>}
              <li className={view.test.passed ? styles.checkOk : styles.checkTodo}>
                {view.test.passed ? "테스트 3턴 통과" : "테스트 3턴 통과 필요"}
              </li>
              {r.warnings.map((w) => (
                <li key={w} className={styles.checkWarn}>
                  {w}
                </li>
              ))}
            </ul>
            <p className={styles.hint}>{publishHint}</p>
            <p id="visibility-hint" className={styles.hint}>
              공개 범위: <strong>{visibilityOption.label}</strong> — {visibilityOption.hint} 발행 뒤에도 바꿀 수 있고, 다시
              테스트할 필요는 없어요.
            </p>
          </div>

          <TestPanel
            draftId={initial.id}
            card={card}
            test={view.test}
            personas={personas}
            ensureSaved={save}
            onTest={(test) => setView((v) => ({ ...v, test }))}
          />
        </aside>
      </div>
    </div>
  );
}
