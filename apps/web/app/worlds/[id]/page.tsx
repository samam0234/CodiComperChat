import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyPersonas } from "@/lib/personas";
import { MODE_LABELS } from "@/lib/world-types";
import { getPlayState, getWorld } from "@/lib/worlds";
import CopperMap from "../copper-map";
import StartPlay from "./start-play";
import styles from "./detail.module.css";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const world = await getWorld(id);
  return { title: world ? `${world.title} · 월드코퍼챗` : "월드코퍼챗" };
}

export default async function WorldDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const world = await getWorld(id);
  if (!world) notFound();
  const user = await getCurrentUser();
  const [personas, state] = user ? await Promise.all([getMyPersonas(), getPlayState(id)]) : [[], null];
  const residents: Record<string, string[]> = {};
  for (const c of world.cast) if (c.homePlace) (residents[c.homePlace] ??= []).push(c.name);

  return (
    <article className={styles.page}>
      <header className={styles.head}>
        <span className={styles.mode}>{MODE_LABELS[world.mode].label}</span>
        <h1 className={styles.title}>{world.title}</h1>
        {world.oneLiner && <p className={styles.oneLiner}>{world.oneLiner}</p>}
        <p className={styles.meta}>
          만든 사람 {world.author} · 등장인물 {world.cast.length} · 파트 {world.parts.length} · 플레이 {world.playCount}
        </p>
        {world.takenDown && (
          <p className={styles.error}>운영자가 이 세계관을 내렸어요. 사유: {world.takenDown.reason ?? "없음"}. 나에게만 보여요.</p>
        )}
        {world.mine && (
          <Link href={`/worlds/${world.id}/edit`} className={styles.secondary}>
            편집기 열기
          </Link>
        )}
      </header>

      <section className={styles.panel}>
        <h2>시작하기</h2>
        <p className={styles.hint}>{MODE_LABELS[world.mode].hint}</p>
        {user ? (
          <StartPlay worldId={world.id} personas={personas} playing={!!state?.play} />
        ) : (
          <Link href={`/login?next=/worlds/${world.id}`} className={styles.primary}>
            로그인하고 플레이
          </Link>
        )}
      </section>

      <section className={styles.panel}>
        <h2>세계관</h2>
        <p className={styles.setting}>{world.setting}</p>
      </section>

      {world.parts.length > 0 && (
        <section className={styles.panel}>
          <h2>파트</h2>
          <ol className={styles.parts}>
            {world.parts.map((p, i) => (
              <li key={i}>
                <span className={styles.partNo}>{i + 1}부</span> {p.title}
              </li>
            ))}
          </ol>
          <p className={styles.hint}>파트의 목표를 이루면 다음 파트로 넘어가요. 목표는 플레이하며 알아 가요.</p>
        </section>
      )}

      <section className={styles.panel}>
        <h2>등장인물</h2>
        <ul className={styles.cast}>
          {world.cast.map((c) => (
            <li key={c.name} className={styles.castCard}>
              <span className={styles.avatar} aria-hidden="true">
                {c.name.slice(0, 1)}
              </span>
              <div>
                <strong>{c.name}</strong>
                {c.homePlace && <span className={styles.home}> · {c.homePlace}</span>}
                <p>{c.summary}</p>
                {c.characterId && (
                  <Link href={`/characters/${c.characterId}`} className={styles.link}>
                    캐릭터 카드 보기
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {(world.places.length > 0 || world.hasMap) && (
        <section className={styles.panel}>
          <h2>코퍼맵</h2>
          <CopperMap worldId={world.id} hasMap={world.hasMap} places={world.places} residents={residents} caption="핀에 마우스를 올리면 사는 사람과 장소 설명이 보여요." />
        </section>
      )}
    </article>
  );
}
