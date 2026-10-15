"use client";

import { useEffect, useId, useState } from "react";
import { loadStory, removeStoryHook } from "@/app/actions/story";
import { formatDayTime } from "@/lib/format-time";
import type { StoryView } from "@/lib/conversations";
import styles from "./story-panel.module.css";

// 기획서 §4.2·§13.4: 캠페인 상태가 대사를 바꾸는 만큼 화면에서도 보여 준다.
// 지난 이야기 요약, 열린 복선(약속·단서), 끝난 일, 친밀도 자동 변화. 정리는 대화가 3번 오갈 때마다 뒤에서 한다
export default function StoryPanel({
  characterId,
  characterName,
  // 메시지가 늘 때마다 바뀌는 값. 펼쳐 둔 상태에서 새 대화가 오가면 잠시 뒤 다시 읽는다
  messageCount,
}: {
  characterId: string;
  characterName: string;
  messageCount: number;
}) {
  const bodyId = useId();
  const [open, setOpen] = useState(false);
  const [story, setStory] = useState<StoryView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const result = await loadStory(characterId);
    setLoading(false);
    if (result.ok) setStory(result.data);
    else setError(result.error);
  };

  // 펼칠 때 읽고, 펼친 채로 대화가 이어지면 정리가 끝날 즈음(몇 초 뒤)에 다시 읽는다
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => void refresh(), story === null ? 0 : 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, messageCount]);

  const removeHook = async (id: string) => {
    const result = await removeStoryHook(characterId, id);
    if (result.ok) setStory((s) => (s ? { ...s, openHooks: s.openHooks.filter((h) => h.id !== id) } : s));
    else setError(result.error);
  };

  const nothing = story !== null && !story.brief && story.openHooks.length === 0 && story.closedEvents.length === 0;

  return (
    <section className={styles.panel} aria-labelledby={`${bodyId}-title`}>
      <button type="button" className={styles.head} aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((v) => !v)}>
        <span id={`${bodyId}-title`} className={styles.title}>
          지난 이야기
        </span>
        <span className={styles.chevron} aria-hidden="true">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div id={bodyId} className={styles.body}>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {story === null && !error && <p className={styles.hint}>불러오는 중…</p>}

          {story && (
            <>
              <p className={styles.relation}>
                친밀도 <strong>{story.relation.value}</strong> · {story.relation.label}
                {!story.auto && <span className={styles.badge}>자동 변화 꺼짐</span>}
              </p>
              {story.auto && story.relation.reason && <p className={styles.hint}>최근 판단: {story.relation.reason}</p>}
              {story.relation.log.length > 0 && (
                <ul className={styles.log} aria-label="친밀도 변화 기록">
                  {[...story.relation.log].reverse().map((entry) => (
                    <li key={entry.at}>
                      <span className={entry.delta > 0 ? styles.up : styles.down}>
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </span>{" "}
                      {entry.reason}
                      <span className={styles.time}> · {formatDayTime(entry.at)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {nothing && (
                <p className={styles.hint}>
                  아직 정리된 이야기가 없어요. {characterName}와 대화가 3번쯤 오가면 지난 이야기·복선·친밀도 변화를 정리해 둡니다.
                </p>
              )}

              {story.brief && (
                <div>
                  <h3 className={styles.sub}>지금까지의 이야기</h3>
                  <p className={styles.brief}>{story.brief}</p>
                </div>
              )}

              {story.openHooks.length > 0 && (
                <div>
                  <h3 className={styles.sub}>아직 이어질 일 (복선)</h3>
                  <ul className={styles.list}>
                    {story.openHooks.map((hook) => (
                      <li key={hook.id}>
                        <span>{hook.text}</span>
                        <button type="button" className={styles.textButton} onClick={() => void removeHook(hook.id)} aria-label={`복선 지우기: ${hook.text}`}>
                          지우기
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className={styles.hint}>잘못 잡힌 복선은 지우면 더 이상 쓰지 않아요.</p>
                </div>
              )}

              {story.closedEvents.length > 0 && (
                <div>
                  <h3 className={styles.sub}>이미 끝난 일</h3>
                  <ul className={styles.listPlain}>
                    {story.closedEvents.map((event) => (
                      <li key={event}>{event}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className={styles.foot}>
            <button type="button" className={styles.textButton} onClick={() => void refresh()} disabled={loading}>
              {loading ? "읽는 중…" : "새로고침"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
