"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./detail.module.css";

type Persona = { id: string; name: string; description: string };

// 플레이 시작: 내 프로필(주인공)을 고른다. 이미 하던 플레이가 있으면 이어 하거나 처음부터
export default function StartPlay({ worldId, personas, playing }: { worldId: string; personas: Persona[]; playing: boolean }) {
  const router = useRouter();
  const [personaId, setPersonaId] = useState(personas[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(restart: boolean) {
    if (restart && !confirm("지금 플레이를 지우고 처음부터 시작할까요? 대화 기록이 사라져요.")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/worlds/${encodeURIComponent(worldId)}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId, restart }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
        setError(Array.isArray(data?.message) ? data.message.join(" ") : (data?.message ?? "시작하지 못했어요."));
        return;
      }
      router.push(`/worlds/${worldId}/play`);
    } finally {
      setPending(false);
    }
  }

  if (playing) {
    return (
      <div className={styles.start}>
        <Link href={`/worlds/${worldId}/play`} className={styles.primary} data-testid="world-continue">
          이어서 플레이
        </Link>
        <div className={styles.restart}>
          <select value={personaId} onChange={(e) => setPersonaId(e.target.value)} aria-label="처음부터 할 때 쓸 내 프로필">
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => start(true)} disabled={pending || !personaId} className={styles.secondary}>
            처음부터
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <p className={styles.hint}>
        플레이하려면 주인공이 될 내 프로필이 필요해요. <Link href="/me">마이페이지에서 프로필 만들기</Link>
      </p>
    );
  }

  return (
    <div className={styles.start}>
      <label className={styles.field}>
        <span>주인공(내 프로필)</span>
        <select value={personaId} onChange={(e) => setPersonaId(e.target.value)} data-testid="world-persona">
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => start(false)} disabled={pending || !personaId} className={styles.primary} data-testid="world-start">
        {pending ? "여는 중…" : "플레이 시작"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
