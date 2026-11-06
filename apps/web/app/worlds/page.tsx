import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { MODE_LABELS, type WorldSummary } from "@/lib/world-types";
import { getMyWorlds, getPublicWorlds } from "@/lib/worlds";
import CreateWorldButton from "./create-button";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "월드코퍼챗" };

function WorldCard({ world, mine }: { world: WorldSummary; mine?: boolean }) {
  return (
    <li>
      <Link href={mine ? `/worlds/${world.id}/edit` : `/worlds/${world.id}`} className={styles.card} data-testid="world-card">
        <span className={styles.mode}>{MODE_LABELS[world.mode].label}</span>
        <strong className={styles.cardTitle}>{world.title}</strong>
        {world.oneLiner && <span className={styles.oneLiner}>{world.oneLiner}</span>}
        <span className={styles.meta}>
          등장인물 {world.castCount} · 파트 {world.partCount}
          {world.hasMap ? " · 코퍼맵" : ""}
          {!mine && ` · 플레이 ${world.playCount}`}
        </span>
        {mine && (
          <span className={styles.state}>
            {world.takenDown ? "운영자가 내림" : world.published ? (world.visibility === "PUBLIC" ? "공개" : world.visibility === "UNLISTED" ? "링크 공개" : "비공개") : "발행 전"}
          </span>
        )}
      </Link>
    </li>
  );
}

export default async function WorldsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [user, worlds] = await Promise.all([getCurrentUser(), getPublicWorlds(q)]);
  const mine = user ? await getMyWorlds() : null;

  return (
    <>
      <section className={styles.hero}>
        <p className={styles.kicker}>월드코퍼챗</p>
        <h1 className={styles.title}>한 세계관, 여러 캐릭터, 하나의 이야기</h1>
        <p className={styles.description}>
          1:1 대화가 아니라 소설·영화·게임처럼 한 세계 안에서 여러 인물과 이야기를 이어 가요. 파트를 넘기며 줄거리를 진행하고, 코퍼맵에서 인물의 위치를 보고, 대화 중
          갑자기 열리는 미니게임 이벤트에서 코레딧을 받을 수 있어요.
        </p>
        {user ? <CreateWorldButton /> : <Link href="/login?next=/worlds" className={styles.create}>로그인하고 세계관 만들기</Link>}
      </section>

      {mine && mine.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>내 세계관</h2>
          <ul className={styles.grid}>
            {mine.map((w) => (
              <WorldCard key={w.id} world={w} mine />
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>공개 세계관</h2>
          <form className={styles.search} role="search">
            <input name="q" defaultValue={q ?? ""} placeholder="제목·소개 검색" aria-label="세계관 검색" maxLength={40} />
            <button type="submit">검색</button>
          </form>
        </div>
        {worlds === null && <p className={styles.notice}>목록을 불러오지 못했어요. apps/api가 켜져 있는지 확인하세요.</p>}
        {worlds?.length === 0 && <p className={styles.empty}>{q ? "검색 결과가 없어요." : "아직 공개된 세계관이 없어요. 첫 세계관을 만들어 보세요."}</p>}
        {worlds && worlds.length > 0 && (
          <ul className={styles.grid}>
            {worlds.map((w) => (
              <WorldCard key={w.id} world={w} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
