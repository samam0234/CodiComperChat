import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHead from "@/components/page-head";
import { WEB_BASE_URL, adminGet, requireAdmin } from "@/lib/api";
import { formatDayTime } from "@/lib/format-time";
import { EVENT_STATUS_LABEL, REVIEW_LABEL, VISIBILITY_LABEL, type AdminWorldDetail } from "@/lib/worlds";
import { ImageDecision, MapDecision, WorldTakedown } from "../world-actions";
import WorldTabs from "../world-tabs";
import styles from "../worlds.module.css";

export const metadata: Metadata = { title: "세계관 상세 · 운영 콘솔" };

export default async function WorldDetailPage({ params }: PageProps<"/worlds/[id]">) {
  const { id } = await params;
  await requireAdmin(`/worlds/${id}`);
  const w = await adminGet<AdminWorldDetail>(`/admin/worlds/${encodeURIComponent(id)}`);
  if (!w) notFound();
  const state = w.takenDownAt ? "내려감" : w.published ? VISIBILITY_LABEL[w.visibility] : "발행 전";

  return (
    <>
      <PageHead title={w.title} description={`${w.modeLabel} · ${state} · 만든 사람 ${w.owner ? `${w.owner.displayName} (${w.owner.email})` : "탈퇴"}`}>
        <span className={styles.actions}>
          {w.published && !w.takenDownAt && (
            <a href={`${WEB_BASE_URL}/worlds/${w.id}`} target="_blank" rel="noreferrer" className={styles.plain} style={{ display: "inline-flex", alignItems: "center" }}>
              웹에서 열기
            </a>
          )}
          <WorldTakedown id={w.id} title={w.title} takenDown={!!w.takenDownAt} />
        </span>
      </PageHead>
      <WorldTabs current="/worlds" />
      <p>
        <Link href="/worlds" className={styles.filter}>
          ← 목록
        </Link>
      </p>

      {w.takenDownAt && (
        <section className={styles.panel}>
          <h2>내린 기록</h2>
          <p>
            {formatDayTime(w.takenDownAt)} · 사유: {w.takedownReason}
          </p>
        </section>
      )}

      <section className={styles.panel}>
        <h2>요약</h2>
        <dl className={styles.kv}>
          <dt>한 줄 소개</dt>
          <dd>{w.oneLiner || "—"}</dd>
          <dt>플레이</dt>
          <dd>
            {w.plays.total}개 (마지막 파트까지 {w.plays.finished}개)
          </dd>
          <dt>이벤트</dt>
          <dd>
            {(Object.keys(EVENT_STATUS_LABEL) as (keyof typeof EVENT_STATUS_LABEL)[]).map((k) => `${EVENT_STATUS_LABEL[k]} ${w.events[k] ?? 0}`).join(" · ")}
          </dd>
          <dt>만든 때 · 고친 때</dt>
          <dd>
            {formatDayTime(w.createdAt)} · {formatDayTime(w.updatedAt)}
          </dd>
        </dl>
      </section>

      <section className={styles.panel}>
        <h2>세계관 설명</h2>
        <p className={styles.pre}>{w.setting || "—"}</p>
        {w.rules && (
          <>
            <h2>세계 규칙</h2>
            <p className={styles.pre}>{w.rules}</p>
          </>
        )}
        <h2>첫 장면</h2>
        <p className={styles.pre}>{w.opening || "—"}</p>
      </section>

      <section className={styles.panel}>
        <h2>등장인물 {w.cast.length}명</h2>
        <ol className={styles.list}>
          {w.cast.map((c) => (
            <li key={c.name}>
              <strong>{c.name}</strong> {c.characterId && <span className={styles.ok}>데려온 캐릭터</span>} — {c.summary}
              <span className={styles.sub}>
                말투: {c.speech || "—"} · 처음 있는 곳: {c.startPlace || "—"} · 사는 곳: {c.homePlace || "—"}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.panel}>
        <h2>파트 {w.parts.length}개 (목표는 판정 모델만 읽는다)</h2>
        {w.parts.length === 0 ? (
          <p className={styles.sub}>파트 없이 자유 진행</p>
        ) : (
          <ol className={styles.list}>
            {w.parts.map((p, i) => (
              <li key={i}>
                <strong>
                  {i + 1}부 · {p.title}
                </strong>
                <span className={styles.sub}>목표: {p.goal}</span>
                {p.opening && <span className={styles.sub}>시작 글: {p.opening}</span>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className={styles.panel}>
        <h2>코퍼맵 · 장소 {w.places.length}곳</h2>
        <div className={styles.map}>
          {w.hasMap && (
            // eslint-disable-next-line @next/next/no-img-element -- 운영자 전용 중계 그림
            <img src={`/api/worlds/${w.id}/map`} alt="코퍼맵 지도" />
          )}
          {w.places.map((p) => (
            <span key={p.name} className={styles.pin} style={{ left: `${p.x}%`, top: `${p.y}%` }} title={p.note}>
              {p.name}
            </span>
          ))}
        </div>
        {w.hasMap && (
          <p className={styles.actions}>
            지도 검수: <span className={w.mapReview === "APPROVED" ? styles.ok : styles.warn}>{REVIEW_LABEL[w.mapReview]}</span>
            <MapDecision id={w.id} review={w.mapReview} />
          </p>
        )}
      </section>

      <section className={styles.panel}>
        <h2>장면 그림 {w.images.length}장</h2>
        {w.images.length === 0 ? (
          <p className={styles.sub}>올린 그림이 없습니다.</p>
        ) : (
          <ul className={styles.gallery}>
            {w.images.map((img) => (
              <li key={img.id} className={styles.card}>
                {/* eslint-disable-next-line @next/next/no-img-element -- 운영자 전용 중계 그림 */}
                <img src={`/api/worlds/${w.id}/images/${img.id}`} alt={img.label} loading="lazy" />
                <strong>{img.label}</strong>
                {img.character && <span className={styles.sub}>인물: {img.character}</span>}
                <span className={img.blockedAt ? styles.danger : img.review === "APPROVED" ? styles.ok : styles.warn}>
                  {img.blockedAt ? "막힘" : REVIEW_LABEL[img.review]}
                </span>
                {img.reviewNote && <span className={styles.sub}>{img.reviewNote}</span>}
                <ImageDecision imageId={img.id} review={img.review} blocked={!!img.blockedAt} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
