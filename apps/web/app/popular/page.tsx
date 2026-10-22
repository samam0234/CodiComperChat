import Link from "next/link";
import CharacterAvatar from "@/components/character-avatar";
import { nameHue } from "@/components/character-list";
import card from "@/components/character-list.module.css";
import { getPopular, type PopularCharacter } from "@/lib/popular";
import styles from "./page.module.css";

const KINDS = [
  { value: "all", label: "전체" },
  { value: "official", label: "공식" },
  { value: "user", label: "유저 제작" },
] as const;
type Kind = (typeof KINDS)[number]["value"];

const fmt = (n: number) => n.toLocaleString("ko-KR");

function Stats({ c }: { c: PopularCharacter }) {
  return (
    <span className={styles.stats}>
      <span>
        대화한 사람 <strong>{fmt(c.stats.players)}</strong>명
      </span>
      <span>
        최근 7일 <strong>{fmt(c.stats.messages7d)}</strong>마디
      </span>
    </span>
  );
}

function Portrait({ c }: { c: PopularCharacter }) {
  return c.portraitMime ? (
    // 중계 라우트가 주는 이미지라 next/image 최적화를 거치지 않는다
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={card.portrait}
      src={`/api/characters/${encodeURIComponent(c.id)}/portrait${c.updatedAt ? `?v=${encodeURIComponent(c.updatedAt)}` : ""}`}
      alt={`${c.name} 초상`}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span className={card.initial} aria-hidden="true">
      {c.name.trim().slice(0, 1) || "?"}
    </span>
  );
}

export default async function PopularPage({ searchParams }: PageProps<"/popular">) {
  const raw = (await searchParams).kind;
  const kind: Kind = KINDS.some((k) => k.value === raw) ? (raw as Kind) : "all";
  const result = await getPopular();
  const all = result.ok ? result.characters : [];
  // 순위는 전체 기준 그대로 두고, 고른 종류만 보여 준다
  const shown = all.filter((c) => kind === "all" || (kind === "official" ? c.official : !c.official));
  const top = shown.slice(0, 3);
  const rest = shown.slice(3);
  const totalPlayers = all.reduce((sum, c) => sum + c.stats.players, 0);
  const totalRecent = all.reduce((sum, c) => sum + c.stats.messages7d, 0);

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="popular-title">
        <p className={styles.eyebrow}>
          <span className={styles.dot} aria-hidden="true" /> 실시간 집계
        </p>
        <h1 id="popular-title" className={styles.title}>
          지금 가장 많이 <span className={styles.gradientText}>이야기 나누는</span> 캐릭터
        </h1>
        <p className={styles.description}>대화한 사람 수가 많은 순, 같으면 최근 7일 동안 오간 말이 많은 순으로 매겨요.</p>
        <dl className={styles.summary}>
          <div>
            <dt>공개 캐릭터</dt>
            <dd>{fmt(all.length)}</dd>
          </div>
          <div>
            <dt>대화한 사람(캐릭터별 합)</dt>
            <dd>{fmt(totalPlayers)}</dd>
          </div>
          <div>
            <dt>최근 7일 오간 말</dt>
            <dd>{fmt(totalRecent)}</dd>
          </div>
        </dl>
      </section>

      <nav className={styles.tabs} aria-label="캐릭터 종류">
        {KINDS.map((k) => (
          <Link
            key={k.value}
            href={k.value === "all" ? "/popular" : `/popular?kind=${k.value}`}
            className={styles.tab}
            aria-current={kind === k.value ? "page" : undefined}
          >
            {k.label}
          </Link>
        ))}
      </nav>

      {!result.ok ? (
        <p className={styles.notice}>{result.message}</p>
      ) : shown.length === 0 ? (
        <p className={styles.notice}>{kind === "all" ? "아직 공개된 캐릭터가 없습니다." : "이 종류의 공개 캐릭터가 아직 없습니다."}</p>
      ) : (
        <>
          <section aria-labelledby="top-title">
            <h2 id="top-title" className={styles.sectionTitle}>
              TOP {top.length}
            </h2>
            <ol className={styles.podium}>
              {top.map((c) => (
                <li key={c.id} className={styles[`place${c.rank <= 3 ? c.rank : 3}`]}>
                  <Link href={`/characters/${c.id}`} className={`${card.card} ${styles.topCard}`}>
                    <div className={card.cover} style={{ "--hue": nameHue(c.name) } as React.CSSProperties}>
                      <Portrait c={c} />
                      <span className={c.official ? `${card.badge} ${card.official}` : card.badge}>
                        {c.official ? "공식" : "유저 제작"}
                      </span>
                      <span className={styles.medal} aria-label={`${c.rank}위`}>
                        {c.rank}
                      </span>
                      <span className={card.name}>{c.name}</span>
                    </div>
                    <div className={card.body}>
                      <p className={card.oneLiner}>{c.oneLiner}</p>
                      <Stats c={c} />
                      <span className={card.cta} aria-hidden="true">
                        대화하기 <span>→</span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {rest.length > 0 && (
            <section aria-labelledby="rank-title">
              <h2 id="rank-title" className={styles.sectionTitle}>
                전체 순위
              </h2>
              <ol className={styles.ranking}>
                {rest.map((c) => (
                  <li key={c.id}>
                    <Link href={`/characters/${c.id}`} className={styles.row}>
                      <span className={styles.rank} aria-label={`${c.rank}위`}>
                        {c.rank}
                      </span>
                      <CharacterAvatar characterId={c.id} name={c.name} hasPortrait={!!c.portraitMime} version={c.updatedAt} size="md" />
                      <span className={styles.rowText}>
                        <span className={styles.rowName}>
                          {c.name}
                          <span className={c.official ? styles.kindOfficial : styles.kind}>{c.official ? "공식" : "유저 제작"}</span>
                        </span>
                        <span className={styles.rowLine}>{c.oneLiner}</span>
                        <Stats c={c} />
                      </span>
                      <span className={styles.rowCta} aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      <section className={styles.upcoming} aria-labelledby="campaign-title">
        <h2 id="campaign-title" className={styles.upcomingTitle}>
          인기 캠페인 <span className={styles.soon}>준비 중</span>
        </h2>
        <p>여러 캐릭터가 함께하는 이야기 묶음(캠페인)이 생기면 여기에 많이 플레이된 순으로 모아 보여 드릴게요.</p>
      </section>
    </div>
  );
}
