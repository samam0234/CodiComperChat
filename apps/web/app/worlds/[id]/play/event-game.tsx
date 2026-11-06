"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventResult, OpenEvent } from "@/lib/world-types";
import styles from "./event.module.css";

// 대화 중 뜨는 이벤트 미니게임. 결과는 서버가 정하고 화면은 고를 것만 보낸다
type Props = {
  worldId: string;
  event: OpenEvent;
  rewardedToday: number;
  cap: number;
  onDone: (result: EventResult | null) => void;
};

const WALL = { U: 1, R: 2, D: 4, L: 8 } as const;
type Dir = keyof typeof WALL;
const STEP: Record<Dir, [number, number]> = { U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0] };
const DICE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function EventGame({ worldId, event, rewardedToday, cap, onDone }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EventResult | null>(null);

  const submit = useCallback(
    async (input: Record<string, unknown>) => {
      setPending(true);
      setError(null);
      try {
        const res = await fetch(`/api/worlds/${encodeURIComponent(worldId)}/play/events/${encodeURIComponent(event.id)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = (await res.json().catch(() => null)) as (EventResult & { message?: string }) | null;
        if (!res.ok || !data) {
          setError(data?.message ?? "결과를 받지 못했어요.");
          return;
        }
        setResult(data);
      } finally {
        setPending(false);
      }
    },
    [worldId, event.id],
  );

  const remaining = Math.max(0, cap - rewardedToday);

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="event-title" data-testid="world-event">
      <div className={styles.card}>
        <p className={styles.kicker}>갑자기 이벤트!</p>
        <h2 id="event-title" className={styles.title}>
          {event.label}
        </h2>
        <p className={styles.hint}>
          이기면 20~50, 져도 참여 보상 5~10 코레딧. 오늘 보상 {remaining > 0 ? `${remaining}번 남음` : "다 받음 (보상 없이 즐길 수 있어요)"} · 하루 {cap}번
        </p>

        {!result && (
          <div className={styles.game}>
            {event.kind === "LADDER" && <Ladder lanes={event.view.lanes ?? 4} disabled={pending} onPick={(choice) => submit({ choice })} />}
            {event.kind === "LOTTERY" && <Lottery straws={event.view.straws ?? 5} disabled={pending} onPick={(choice) => submit({ choice })} />}
            {event.kind === "DICE" && (
              <button type="button" className={styles.primary} disabled={pending} onClick={() => submit({})} data-testid="event-roll">
                🎲 주사위 굴리기
              </button>
            )}
            {event.kind === "BOWLING" && <Bowling hint={event.view.hint ?? ""} disabled={pending} onThrow={(aim, power) => submit({ aim, power })} />}
            {event.kind === "MAZE" && event.view.cells && (
              <Maze size={event.view.size ?? 7} cells={event.view.cells} limit={event.view.timeLimitS ?? 90} disabled={pending} onFinish={(moves) => submit({ moves })} />
            )}
          </div>
        )}

        {result && <Result result={result} />}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          {result ? (
            <button type="button" className={styles.primary} onClick={() => onDone(result)} data-testid="event-close">
              이야기로 돌아가기
            </button>
          ) : (
            <button type="button" className={styles.secondary} onClick={() => onDone(null)}>
              나중에 (다음 말을 보내면 이벤트가 끝나요)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Result({ result }: { result: EventResult }) {
  const o = result.outcome;
  return (
    <div className={result.won ? styles.win : styles.lose} data-testid="event-result">
      <strong>{result.won ? "승리!" : "아쉽게 졌어요"}</strong>
      <span>
        {result.rewarded ? `+${result.reward} 코레딧` : "오늘 보상은 다 받았어요"}
        {result.balance !== null ? ` · 잔액 ${result.balance.toLocaleString()}` : ""}
      </span>
      {result.kind === "DICE" && Array.isArray(o.me) && Array.isArray(o.host) && (
        <p className={styles.dice}>
          나 {(o.me as number[]).map((n) => DICE[n]).join(" ")} {(o.me as number[]).reduce((a, b) => a + b, 0)} : {(o.host as number[]).reduce((a, b) => a + b, 0)}{" "}
          {(o.host as number[]).map((n) => DICE[n]).join(" ")} 상대
        </p>
      )}
      {result.kind === "BOWLING" && typeof o.pins === "number" && (
        <p className={styles.pins} aria-label={`${o.pins}핀`}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={i < (o.pins as number) ? styles.pinDown : styles.pinUp} />
          ))}{" "}
          {o.pins}핀
        </p>
      )}
      {result.kind === "LADDER" && <LadderReveal outcome={o} />}
      {result.kind === "LOTTERY" && Array.isArray(o.winners) && <p>당첨 제비: {(o.winners as number[]).map((w) => w + 1).join(", ")}번</p>}
      {result.kind === "MAZE" && <p>{o.reached ? `${o.steps}걸음 만에 출구!` : o.valid === false ? "벽에 부딪혔어요." : o.inTime === false ? "시간이 지났어요." : "출구에 닿지 못했어요."}</p>}
    </div>
  );
}

function Ladder({ lanes, disabled, onPick }: { lanes: number; disabled: boolean; onPick: (i: number) => void }) {
  return (
    <div className={styles.choices}>
      <p>출발할 줄을 고르세요. 당첨 칸은 하나예요.</p>
      <div className={styles.lanes}>
        {Array.from({ length: lanes }, (_, i) => (
          <button key={i} type="button" className={styles.lane} disabled={disabled} onClick={() => onPick(i)} data-testid="event-choice">
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function LadderReveal({ outcome }: { outcome: Record<string, unknown> }) {
  const rungs = (outcome.rungs as [number, number][]) ?? [];
  const lanes = 4;
  const rows = 10;
  const w = 240;
  const h = 180;
  const x = (lane: number) => 30 + (lane * (w - 60)) / (lanes - 1);
  const y = (row: number) => 14 + ((row + 0.5) * (h - 28)) / rows;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.ladder} role="img" aria-label={`${(outcome.choice as number) + 1}번 줄 → ${(outcome.end as number) + 1}번 칸, 당첨 ${(outcome.prize as number) + 1}번`}>
      {Array.from({ length: lanes }, (_, i) => (
        <line key={i} x1={x(i)} y1={8} x2={x(i)} y2={h - 8} className={i === outcome.choice ? styles.laneMine : styles.laneLine} />
      ))}
      {rungs.map(([r, l], i) => (
        <line key={i} x1={x(l)} y1={y(r)} x2={x(l + 1)} y2={y(r)} className={styles.laneLine} />
      ))}
      <text x={x(outcome.prize as number)} y={h - 1} textAnchor="middle" className={styles.prize}>
        ★
      </text>
    </svg>
  );
}

function Lottery({ straws, disabled, onPick }: { straws: number; disabled: boolean; onPick: (i: number) => void }) {
  return (
    <div className={styles.choices}>
      <p>제비를 하나 뽑으세요. {straws}개 중 2개가 당첨이에요.</p>
      <div className={styles.lanes}>
        {Array.from({ length: straws }, (_, i) => (
          <button key={i} type="button" className={styles.straw} disabled={disabled} onClick={() => onPick(i)} data-testid="event-choice" aria-label={`${i + 1}번 제비`}>
            <span />
          </button>
        ))}
      </div>
    </div>
  );
}

function Bowling({ hint, disabled, onThrow }: { hint: string; disabled: boolean; onThrow: (aim: number, power: number) => void }) {
  const [aim, setAim] = useState(0);
  const [power, setPower] = useState(0.5);
  return (
    <div className={styles.choices}>
      <p>{hint}. 방향과 세기를 맞춰 8핀 이상 쓰러뜨리면 승리!</p>
      <label className={styles.slider}>
        방향 {aim < -0.05 ? "왼쪽" : aim > 0.05 ? "오른쪽" : "가운데"}
        <input type="range" min={-1} max={1} step={0.05} value={aim} onChange={(e) => setAim(Number(e.target.value))} aria-label="방향" />
      </label>
      <label className={styles.slider}>
        세기 {Math.round(power * 100)}%
        <input type="range" min={0} max={1} step={0.05} value={power} onChange={(e) => setPower(Number(e.target.value))} aria-label="세기" />
      </label>
      <button type="button" className={styles.primary} disabled={disabled} onClick={() => onThrow(aim, power)} data-testid="event-throw">
        🎳 굴리기
      </button>
    </div>
  );
}

function Maze({ size, cells, limit, disabled, onFinish }: { size: number; cells: number[]; limit: number; disabled: boolean; onFinish: (moves: string) => void }) {
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const [left, setLeft] = useState(limit);
  const moves = useRef("");
  const done = useRef(false);
  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onFinish(moves.current);
  }, [onFinish]);

  const go = useCallback(
    (d: Dir) => {
      if (done.current || disabled) return;
      setPos(([x, y]) => {
        if (cells[y * size + x] & WALL[d]) return [x, y];
        const nx = x + STEP[d][0];
        const ny = y + STEP[d][1];
        moves.current += d;
        if (nx === size - 1 && ny === size - 1) setTimeout(finish, 150);
        return [nx, ny];
      });
    },
    [cells, size, disabled, finish],
  );

  useEffect(() => {
    const timer = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (left === 0) finish();
  }, [left, finish]);
  useEffect(() => {
    const keys: Record<string, Dir> = { ArrowUp: "U", ArrowRight: "R", ArrowDown: "D", ArrowLeft: "L" };
    const onKey = (e: KeyboardEvent) => {
      const d = keys[e.key];
      if (d) {
        e.preventDefault();
        go(d);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <div className={styles.choices}>
      <p>
        방향키나 아래 버튼으로 오른쪽 아래 ★까지 가세요. 남은 시간 <strong>{left}초</strong>
      </p>
      <div className={styles.maze} style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} data-testid="event-maze">
        {cells.map((c, i) => {
          const x = i % size;
          const y = Math.floor(i / size);
          return (
            <span
              key={i}
              className={styles.cell}
              style={{
                borderTopWidth: c & WALL.U ? 2 : 0,
                borderRightWidth: c & WALL.R ? 2 : 0,
                borderBottomWidth: c & WALL.D ? 2 : 0,
                borderLeftWidth: c & WALL.L ? 2 : 0,
              }}
            >
              {pos[0] === x && pos[1] === y ? "●" : x === size - 1 && y === size - 1 ? "★" : ""}
            </span>
          );
        })}
      </div>
      <div className={styles.pad}>
        {(["U", "L", "D", "R"] as Dir[]).map((d) => (
          <button key={d} type="button" onClick={() => go(d)} disabled={disabled} aria-label={{ U: "위", L: "왼쪽", D: "아래", R: "오른쪽" }[d]}>
            {{ U: "↑", L: "←", D: "↓", R: "→" }[d]}
          </button>
        ))}
        <button type="button" onClick={finish} disabled={disabled} className={styles.secondary}>
          포기
        </button>
      </div>
    </div>
  );
}
