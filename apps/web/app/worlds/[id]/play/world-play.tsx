"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ChatText from "@/components/chat-text";
import { worldImageUrl, type EventResult, type PlayMessage, type PlayState, type Segment } from "@/lib/world-types";
import CopperMap from "../../copper-map";
import EventGame from "./event-game";
import styles from "./play.module.css";

type Play = NonNullable<PlayState["play"]>;

async function errorText(res: Response, fallback: string) {
  const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
  return Array.isArray(data?.message) ? data.message.join(" ") : (data?.message ?? fallback);
}

// 이름의 첫 글자로 만든 동그라미 (인물마다 색이 달라지게 이름으로 색을 고른다)
function Avatar({ name }: { name: string }) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span className={styles.avatar} style={{ background: `hsl(${hash} 65% 55%)` }} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  );
}

export default function WorldPlay({ initial }: { initial: PlayState }) {
  const [state, setState] = useState(initial);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [eventHidden, setEventHidden] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const world = state.world;
  const play = state.play as Play;
  const names = world.cast.map((c) => c.name);
  const userName = play.persona.name;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [play.messages.length]);

  const people = useMemo(() => {
    const at: Record<string, string[]> = {};
    for (const [name, place] of Object.entries(play.locations)) (at[place] ??= []).push(name);
    return at;
  }, [play.locations]);

  async function send() {
    const message = text.trim();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/worlds/${encodeURIComponent(world.id)}/play/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
      if (!res.ok) {
        setError(await errorText(res, "답을 받지 못했어요."));
        return;
      }
      setState((await res.json()) as PlayState);
      setText("");
      setEventHidden(false);
    } catch {
      setError("서버에 연결할 수 없어요.");
    } finally {
      setPending(false);
    }
  }

  function eventDone(result: EventResult | null) {
    if (!result) {
      setEventHidden(true);
      return;
    }
    setToast(result.rewarded ? `${result.label} ${result.won ? "승리" : "참여"} +${result.reward} 코레딧` : `${result.label} ${result.won ? "승리" : "패배"} (오늘 보상은 다 받음)`);
    setState((s) => ({ ...s, rewardedToday: result.rewardedToday, play: s.play ? { ...s.play, event: null } : s.play }));
    setTimeout(() => setToast(null), 4000);
  }

  const partTotal = world.partTitles.length;
  const partLabel =
    partTotal === 0 ? "자유 진행" : play.finished ? `모든 파트 완료 (${partTotal}부)` : `${play.partIndex + 1}부 / ${partTotal} · ${world.partTitles[play.partIndex]}`;

  return (
    <div className={`${styles.shell} ${styles[world.mode]}`} data-mode={world.mode}>
      <header className={styles.bar}>
        <div className={styles.barTitle}>
          <Link href={`/worlds/${world.id}`} className={styles.back} aria-label="세계관 소개로">
            ←
          </Link>
          <div>
            <h1>{world.title}</h1>
            <p>
              <span className={styles.part} data-testid="world-part">
                {partLabel}
              </span>{" "}
              · {world.modeLabel} · 주인공 {userName}
              {(play.scenePlace || play.sceneTime) && (
                <span>
                  {" "}
                  · {[play.scenePlace, play.sceneTime].filter(Boolean).join(" · ")}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className={styles.barActions}>
          {(world.places.length > 0 || Object.keys(play.locations).length > 0) && (
            <button type="button" className={mapOpen ? styles.chipOn : styles.chip} onClick={() => setMapOpen((v) => !v)} aria-expanded={mapOpen} data-testid="map-toggle">
              코퍼맵
            </button>
          )}
          {play.event && eventHidden && (
            <button type="button" className={styles.chipHot} onClick={() => setEventHidden(false)}>
              이벤트 열기
            </button>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <main className={styles.stage} aria-live="polite">
          {world.mode === "VISUAL_NOVEL" ? (
            <VisualNovel worldId={world.id} messages={play.messages} images={world.images} userName={userName} />
          ) : (
            <ol className={styles.log}>
              {play.messages.map((m) => (
                <MessageView key={m.id} m={m} mode={world.mode} worldId={world.id} userName={userName} names={names} />
              ))}
              {pending && (
                <li className={styles.typing} aria-label="답을 쓰는 중">
                  <span />
                  <span />
                  <span />
                </li>
              )}
            </ol>
          )}
          <div ref={bottom} />
        </main>

        {mapOpen && (
          <aside className={styles.side} aria-label="코퍼맵">
            <CopperMap worldId={world.id} hasMap={world.hasMap} places={world.places} people={people} caption="분홍 핀: 지금 인물이 있는 곳" />
            <ul className={styles.whereList}>
              {world.cast.map((c) => (
                <li key={c.name}>
                  <Avatar name={c.name} /> <strong>{c.name}</strong> <span>{play.locations[c.name] ?? "어딘가"}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <footer className={styles.composer}>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.inputRow}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            maxLength={1000}
            rows={2}
            placeholder={
              world.mode === "MESSENGER"
                ? "메시지 보내기 · 비워 두고 보내면 다음 대화를 이어 갑니다"
                : "행동은 *별표*, 장면 지시는 (괄호). 비워 두고 보내면 다음 장면을 이어 갑니다"
            }
            aria-label="할 말"
            data-testid="world-input"
          />
          <button type="button" onClick={send} disabled={pending} className={styles.send} data-testid="world-send" title="비워 두고 보내면 다음 장면을 예상해 진행합니다">
            {pending ? "…" : "보내기"}
          </button>
        </div>
      </footer>

      {toast && (
        <p className={styles.toast} role="status">
          {toast}
        </p>
      )}

      {play.event && !eventHidden && (
        <EventGame worldId={world.id} event={play.event} rewardedToday={state.rewardedToday ?? 0} cap={state.dailyRewardCap} onDone={eventDone} />
      )}
    </div>
  );
}

function SceneImage({ worldId, imageId, label }: { worldId: string; imageId: string; label?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 로그인 쿠키로 중계하는 그림이라 next/image 최적화를 쓰지 않는다
    <img src={worldImageUrl(worldId, imageId)} alt={label ?? "장면 그림"} className={styles.scene} loading="lazy" data-testid="scene-image" />
  );
}

function MessageView({ m, mode, worldId, userName, names }: { m: PlayMessage; mode: PlayState["world"]["mode"]; worldId: string; userName: string; names: string[] }) {
  if (m.role === "SYSTEM") {
    return (
      <li className={styles.system} data-testid="world-system">
        {m.content}
      </li>
    );
  }
  if (m.role === "USER") {
    if (mode === "NOVEL") {
      return (
        <li className={styles.novelUser}>
          <span>— {userName}</span> <ChatText text={m.content} userName={userName} />
        </li>
      );
    }
    return (
      <li className={styles.userRow}>
        {mode === "MESSENGER" && <span className={styles.meName}>{userName}</span>}
        <div className={styles.userBubble}>
          <ChatText text={m.content} userName={userName} />
        </div>
      </li>
    );
  }
  const segs: Segment[] = m.segments ?? [{ kind: "narration", speaker: null, text: m.content }];
  if (mode === "NOVEL") {
    return (
      <li className={styles.novel} data-testid="world-reply">
        {m.imageId && <SceneImage worldId={worldId} imageId={m.imageId} />}
        {segs.map((s, i) => (
          <p key={i}>{s.speaker ? <><strong>{s.speaker}</strong> — {s.text}</> : s.text}</p>
        ))}
      </li>
    );
  }
  return (
    <li className={styles.reply} data-testid="world-reply">
      {m.imageId && <SceneImage worldId={worldId} imageId={m.imageId} />}
      {segs.map((s, i) =>
        s.kind === "narration" ? (
          mode === "MESSENGER" ? (
            <p key={i} className={styles.dmNotice}>
              {s.text}
            </p>
          ) : (
            <div key={i} className={styles.narration}>
              <ChatText text={s.text} userName={userName} />
            </div>
          )
        ) : (
          <div key={i} className={styles.line}>
            <Avatar name={s.speaker ?? "?"} />
            <div>
              <span className={styles.speaker}>{s.speaker}</span>
              <div className={names.includes(s.speaker ?? "") ? styles.bubble : styles.bubbleUnknown}>
                <ChatText text={s.text} userName={userName} />
              </div>
            </div>
          </div>
        ),
      )}
    </li>
  );
}

// 비주얼노벨: 그림 위 대사 상자를 한 줄씩 넘긴다. 지난 대사는 기록 열기로 본다
function VisualNovel({
  worldId,
  messages,
  images,
  userName,
}: {
  worldId: string;
  messages: PlayMessage[];
  images: PlayState["world"]["images"];
  userName: string;
}) {
  const lastReply = [...messages].reverse().find((m) => m.role === "CHARACTER");
  const segs = useMemo(() => lastReply?.segments ?? (lastReply ? [{ kind: "narration" as const, speaker: null, text: lastReply.content }] : []), [lastReply]);
  const [index, setIndex] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  useEffect(() => setIndex(0), [lastReply?.id]);
  const seg = segs[Math.min(index, segs.length - 1)];
  // 배경: 이 답과 함께 고른 장면 그림 → 없으면 가장 최근 장면 그림
  const bg = lastReply?.imageId ?? [...messages].reverse().find((m) => m.imageId)?.imageId ?? null;
  // 서 있는 그림: 말하는 인물의 그림이 있으면
  const sprite = seg?.speaker ? images.find((i) => i.character === seg.speaker) : undefined;
  const lastSystem = [...messages].reverse().find((m) => m.role === "SYSTEM");

  return (
    <div className={styles.vn} data-testid="world-reply">
      <div className={styles.vnStage}>
        {bg ? <SceneImage worldId={worldId} imageId={bg} /> : <div className={styles.vnBlank} />}
        {sprite && (
          // eslint-disable-next-line @next/next/no-img-element -- 중계 그림
          <img src={worldImageUrl(worldId, sprite.id)} alt={sprite.label} className={styles.sprite} />
        )}
        {lastSystem && <span className={styles.vnPart}>{lastSystem.content}</span>}
      </div>
      {seg && (
        <button type="button" className={styles.vnBox} onClick={() => setIndex((i) => Math.min(i + 1, segs.length - 1))} aria-label="다음 대사">
          {seg.speaker && <span className={styles.vnName}>{seg.speaker}</span>}
          <ChatText text={seg.text} userName={userName} />
          <span className={styles.vnNext}>{index < segs.length - 1 ? `▼ ${index + 1}/${segs.length}` : "■"}</span>
        </button>
      )}
      <button type="button" className={styles.chip} onClick={() => setLogOpen((v) => !v)}>
        {logOpen ? "기록 닫기" : "지난 대사 기록"}
      </button>
      {logOpen && (
        <ol className={styles.vnLog}>
          {messages.map((m) => (
            <li key={m.id}>
              {m.role === "USER" ? <strong>{userName}: </strong> : null}
              {m.content}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
