"use client";

import type { MouseEvent } from "react";
import { worldMapUrl, type Place } from "@/lib/world-types";
import styles from "./copper-map.module.css";

type Props = {
  worldId: string;
  hasMap: boolean;
  places: Place[];
  // 장소 이름 → 그곳에 있는 인물 (지금 위치)
  people?: Record<string, string[]>;
  // 장소 이름 → 그곳에 사는 인물
  residents?: Record<string, string[]>;
  // 편집기: 지도를 누르면 그 좌표(백분율)를 돌려준다
  onPick?: (x: number, y: number) => void;
  selected?: string | null;
  onSelect?: (name: string) => void;
  version?: string;
  caption?: string;
};

// 코퍼맵: 세계관 지도(또는 도표) 위에 장소 핀과 그곳에 있는 인물을 보여 준다. 지도 그림이 없으면 격자 바탕
export default function CopperMap({ worldId, hasMap, places, people = {}, residents = {}, onPick, selected, onSelect, version, caption }: Props) {
  function pick(event: MouseEvent<HTMLDivElement>) {
    if (!onPick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    onPick(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  }

  return (
    <figure className={styles.figure} data-testid="copper-map">
      <div className={`${styles.map} ${onPick ? styles.pickable : ""}`} onClick={pick} role={onPick ? "button" : undefined} aria-label={onPick ? "지도를 눌러 장소 핀을 놓기" : undefined}>
        {hasMap ? (
          // eslint-disable-next-line @next/next/no-img-element -- 로그인 쿠키로 중계하는 그림이라 next/image 최적화를 쓰지 않는다
          <img src={worldMapUrl(worldId, version)} alt="코퍼맵 지도" className={styles.image} draggable={false} />
        ) : (
          <div className={styles.grid} aria-hidden="true" />
        )}
        {places.map((p) => {
          const here = people[p.name] ?? [];
          const live = residents[p.name] ?? [];
          return (
            <button
              key={p.name}
              type="button"
              className={`${styles.pin} ${selected === p.name ? styles.selected : ""} ${here.length ? styles.occupied : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(p.name);
              }}
              title={[p.note, live.length ? `사는 사람: ${live.join(", ")}` : ""].filter(Boolean).join(" · ") || p.name}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.label}>{p.name}</span>
              {here.length > 0 && <span className={styles.people}>{here.join(" · ")}</span>}
            </button>
          );
        })}
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
