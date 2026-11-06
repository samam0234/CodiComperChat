import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/page-head";
import { WEB_BASE_URL, adminGet, requireAdmin } from "@/lib/api";
import { formatDayTime } from "@/lib/format-time";
import { VISIBILITY_LABEL, type AdminWorldRow, type WorldStats } from "@/lib/worlds";
import StatsRow from "./stats-row";
import { WorldTakedown } from "./world-actions";
import WorldTabs from "./world-tabs";
import styles from "./worlds.module.css";

export const metadata: Metadata = { title: "월드코퍼챗 · 운영 콘솔" };

const FILTERS = [
  { value: "all", label: "전체" },
  { value: "public", label: "공개" },
  { value: "unlisted", label: "링크 공개" },
  { value: "private", label: "비공개" },
  { value: "unpublished", label: "발행 전" },
  { value: "needs-review", label: "검수 대기 있음" },
  { value: "taken-down", label: "내려감" },
] as const;

function status(w: AdminWorldRow) {
  if (w.takenDownAt) return { label: "내려감", tone: styles.danger };
  if (!w.published) return { label: "발행 전", tone: styles.muted };
  return { label: VISIBILITY_LABEL[w.visibility], tone: w.visibility === "PUBLIC" ? styles.ok : styles.muted };
}

export default async function WorldsPage({ searchParams }: PageProps<"/worlds">) {
  await requireAdmin("/worlds");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const filter = typeof params.filter === "string" && FILTERS.some((f) => f.value === params.filter) ? params.filter : "all";
  const [stats, rows] = await Promise.all([
    adminGet<WorldStats>("/admin/world-stats"),
    adminGet<AdminWorldRow[]>(`/admin/worlds?${new URLSearchParams({ q, filter, take: "200" })}`),
  ]);

  return (
    <>
      <PageHead title="월드코퍼챗" description="이용자가 만든 세계관(비공개·발행 전·내려간 것까지). 그림 검수, 이벤트 보상 기록, 하루 보상 횟수를 여기서 관리합니다." />
      <WorldTabs current="/worlds" pending={stats?.pendingReview} />
      <StatsRow stats={stats} />

      <form className={styles.toolbar} role="search">
        <input className={styles.search} name="q" defaultValue={q} placeholder="제목·소개·만든 사람 이메일로 찾기" aria-label="세계관 찾기" />
        <input type="hidden" name="filter" value={filter} />
        <button type="submit" className={styles.button}>
          찾기
        </button>
      </form>
      <nav className={styles.filters} aria-label="상태로 거르기">
        {FILTERS.map((f) => (
          <Link key={f.value} href={`/worlds?${new URLSearchParams({ ...(q ? { q } : {}), filter: f.value })}`} className={styles.filter} aria-current={filter === f.value ? "page" : undefined}>
            {f.label}
          </Link>
        ))}
      </nav>

      {!rows ? (
        <p className={styles.error}>목록을 불러오지 못했습니다. apps/api가 켜져 있는지 확인하세요.</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>해당하는 세계관이 없습니다.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>세계관</th>
                <th>만든 사람</th>
                <th>상태</th>
                <th className={styles.num}>인물·파트·그림</th>
                <th className={styles.num}>플레이</th>
                <th>검수</th>
                <th>고친 때</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => {
                const s = status(w);
                return (
                  <tr key={w.id}>
                    <td>
                      <Link href={`/worlds/${w.id}`} className={styles.titleLink}>
                        {w.title}
                      </Link>
                      <span className={styles.sub}>
                        {w.modeLabel}
                        {w.oneLiner ? ` · ${w.oneLiner}` : ""}
                      </span>
                      {w.takedownReason && <span className={styles.sub}>사유: {w.takedownReason}</span>}
                    </td>
                    <td>
                      {w.owner ? (
                        <>
                          {w.owner.displayName}
                          <span className={styles.sub}>{w.owner.email}</span>
                        </>
                      ) : (
                        <span className={styles.muted}>탈퇴</span>
                      )}
                    </td>
                    <td>
                      <span className={s.tone}>{s.label}</span>
                    </td>
                    <td className={styles.num}>
                      {w.counts.cast} · {w.counts.parts} · {w.counts.images}
                    </td>
                    <td className={styles.num}>{w.counts.plays}</td>
                    <td>{w.pendingImages > 0 ? <span className={styles.warn}>대기 {w.pendingImages}</span> : <span className={styles.muted}>없음</span>}</td>
                    <td>{formatDayTime(w.updatedAt)}</td>
                    <td>
                      <span className={styles.actions}>
                        {w.published && !w.takenDownAt && (
                          <a href={`${WEB_BASE_URL}/worlds/${w.id}`} target="_blank" rel="noreferrer" className={styles.plain} style={{ display: "inline-flex", alignItems: "center" }}>
                            웹에서 열기
                          </a>
                        )}
                        <WorldTakedown id={w.id} title={w.title} takenDown={!!w.takenDownAt} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
