import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/page-head";
import { adminGet, requireAdmin } from "@/lib/api";
import { formatDayTime } from "@/lib/format-time";
import { EVENT_STATUS_LABEL, type AdminWorldEvent, type WorldStats } from "@/lib/worlds";
import StatsRow from "../stats-row";
import WorldTabs from "../world-tabs";
import styles from "../worlds.module.css";

export const metadata: Metadata = { title: "이벤트 기록 · 운영 콘솔" };

const STATUSES = ["all", "open", "won", "lost", "expired"] as const;
const TONE = { OPEN: styles.warn, WON: styles.ok, LOST: styles.muted, EXPIRED: styles.muted } as const;

export default async function WorldEventsPage({ searchParams }: PageProps<"/worlds/events">) {
  await requireAdmin("/worlds/events");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" && (STATUSES as readonly string[]).includes(params.status) ? params.status : "all";
  const [stats, rows] = await Promise.all([
    adminGet<WorldStats>("/admin/world-stats"),
    adminGet<AdminWorldEvent[]>(`/admin/world-events?${new URLSearchParams({ q, status, take: "300" })}`),
  ]);

  return (
    <>
      <PageHead
        title="이벤트 기록"
        description="대화 중 뜬 미니게임과 보상. 승리 20~50, 패배 5~10 코레딧이고, 하루 보상 횟수를 넘긴 이벤트는 보상 없이 기록만 남습니다. 코레딧 장부의 사유는 EVENT입니다."
      />
      <WorldTabs current="/worlds/events" pending={stats?.pendingReview} />
      <StatsRow stats={stats} />
      <form className={styles.toolbar} role="search">
        <input className={styles.search} name="q" defaultValue={q} placeholder="이메일·세계관 제목으로 찾기" aria-label="이벤트 찾기" />
        <input type="hidden" name="status" value={status} />
        <button type="submit" className={styles.button}>
          찾기
        </button>
      </form>
      <nav className={styles.filters} aria-label="결과로 거르기">
        {STATUSES.map((s) => (
          <Link key={s} href={`/worlds/events?${new URLSearchParams({ ...(q ? { q } : {}), status: s })}`} className={styles.filter} aria-current={status === s ? "page" : undefined}>
            {s === "all" ? "전체" : EVENT_STATUS_LABEL[s.toUpperCase() as keyof typeof EVENT_STATUS_LABEL]}
          </Link>
        ))}
      </nav>
      {!rows ? (
        <p className={styles.error}>기록을 불러오지 못했습니다.</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>기록이 없습니다.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>뜬 때</th>
                <th>게임</th>
                <th>결과</th>
                <th className={styles.num}>보상</th>
                <th>계정 · 주인공</th>
                <th>세계관</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>
                    {formatDayTime(e.createdAt)}
                    {e.resolvedAt && <span className={styles.sub}>끝남 {formatDayTime(e.resolvedAt)}</span>}
                  </td>
                  <td>{e.label}</td>
                  <td>
                    <span className={TONE[e.status]}>{EVENT_STATUS_LABEL[e.status]}</span>
                  </td>
                  <td className={styles.num}>{e.rewarded ? `+${e.reward}` : e.status === "WON" || e.status === "LOST" ? "한도 초과" : "—"}</td>
                  <td>
                    {e.play.user.email}
                    <span className={styles.sub}>{e.play.personaName}</span>
                  </td>
                  <td>
                    <Link href={`/worlds/${e.play.world.id}`} className={styles.titleLink}>
                      {e.play.world.title}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
