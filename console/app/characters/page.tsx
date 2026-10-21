import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/page-head";
import { WEB_BASE_URL, adminGet, requireAdmin } from "@/lib/api";
import type { AdminCharacter } from "@/lib/types";
import CharacterActions from "./character-actions";
import styles from "./characters.module.css";

export const metadata: Metadata = { title: "캐릭터 · 운영 콘솔" };

const FILTERS = [
  { value: "all", label: "전체" },
  { value: "public", label: "공개" },
  { value: "unlisted", label: "링크 공개" },
  { value: "private", label: "비공개" },
  { value: "official", label: "운영 캐릭터" },
  { value: "taken-down", label: "내려감" },
  { value: "unpublished", label: "발행 취소" },
] as const;

const VISIBILITY = { PUBLIC: "공개", UNLISTED: "링크 공개", PRIVATE: "비공개" } as const;

function status(c: AdminCharacter) {
  if (c.takenDownAt) return { label: "내려감", tone: styles.danger };
  if (!c.published) return { label: "발행 취소", tone: styles.muted };
  return { label: VISIBILITY[c.visibility], tone: c.visibility === "PUBLIC" ? styles.ok : styles.muted };
}

export default async function CharactersPage({ searchParams }: PageProps<"/characters">) {
  await requireAdmin("/characters");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const filter = typeof params.filter === "string" && FILTERS.some((f) => f.value === params.filter) ? params.filter : "all";
  const rows = await adminGet<AdminCharacter[]>(`/admin/characters?${new URLSearchParams({ q, filter, take: "200" })}`);

  return (
    <>
      <PageHead title="캐릭터" description="발행된 모든 캐릭터(비공개·내려간 것까지). 신고가 없어도 여기서 바로 내리거나 복구할 수 있습니다." />

      <form className={styles.toolbar} role="search">
        <input className={styles.search} name="q" defaultValue={q} placeholder="이름·한 줄 소개로 찾기" aria-label="캐릭터 찾기" />
        <input type="hidden" name="filter" value={filter} />
        <button type="submit" className={styles.searchButton}>
          찾기
        </button>
      </form>
      <nav className={styles.filters} aria-label="상태로 거르기">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/characters?${new URLSearchParams({ ...(q ? { q } : {}), filter: f.value })}`}
            className={styles.filter}
            aria-current={filter === f.value ? "page" : undefined}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {!rows ? (
        <p className={styles.error}>목록을 불러오지 못했습니다. apps/api가 켜져 있는지 확인하세요.</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>해당하는 캐릭터가 없습니다.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>캐릭터</th>
                <th>만든 사람</th>
                <th>상태</th>
                <th className={styles.num}>대화</th>
                <th className={styles.num}>열린 신고</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const s = status(c);
                return (
                  <tr key={c.id} aria-label={c.name}>
                    <td>
                      <div className={styles.who}>
                        {c.hasPortrait ? (
                          // 운영자 전용 중계(비공개·내려간 캐릭터 포함). 검수 대상이라 캐시하지 않는다
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/characters/${encodeURIComponent(c.id)}/portrait`} alt="" width={40} height={40} className={styles.avatar} />
                        ) : (
                          <span className={styles.avatarFallback} aria-hidden="true">
                            {c.name.slice(0, 1)}
                          </span>
                        )}
                        <span>
                          <a href={`${WEB_BASE_URL}/characters/${c.id}`} target="_blank" rel="noopener noreferrer" className={styles.name}>
                            {c.name}
                          </a>
                          <span className={styles.oneLiner}>{c.oneLiner}</span>
                        </span>
                      </div>
                    </td>
                    <td className={styles.owner}>{c.official ? <span className={styles.official}>운영</span> : c.owner ? `${c.owner.displayName} · ${c.owner.email}` : "탈퇴한 계정"}</td>
                    <td>
                      <span className={`${styles.status} ${s.tone}`}>{s.label}</span>
                      {c.takedownReason && <span className={styles.reason}>{c.takedownReason}</span>}
                    </td>
                    <td className={styles.num}>{c.conversations}</td>
                    <td className={styles.num}>{c.openReports > 0 ? <Link href="/reports" className={styles.reportLink}>{c.openReports}</Link> : 0}</td>
                    <td>
                      <CharacterActions id={c.id} name={c.name} takenDown={!!c.takenDownAt} published={c.published} />
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
