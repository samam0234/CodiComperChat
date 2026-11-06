import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/page-head";
import { adminGet, requireAdmin } from "@/lib/api";
import { formatDayTime } from "@/lib/format-time";
import type { ReviewQueue } from "@/lib/worlds";
import { ImageDecision, MapDecision } from "../world-actions";
import WorldTabs from "../world-tabs";
import styles from "../worlds.module.css";

export const metadata: Metadata = { title: "세계관 그림 검수 · 운영 콘솔" };

export default async function WorldReviewPage() {
  await requireAdmin("/worlds/review");
  const queue = await adminGet<ReviewQueue>("/admin/world-review");
  const pending = queue ? queue.images.length + queue.maps.length : 0;

  return (
    <>
      <PageHead
        title="그림·지도 검수"
        description="자동 검수가 애매하다고 본 장면 그림과 코퍼맵 지도입니다. 통과하면 플레이에 나오고, 거절하면 만든 사람만 봅니다. 막으면 진행자에게도 나가지 않습니다."
      />
      <WorldTabs current="/worlds/review" pending={pending} />
      {!queue ? (
        <p className={styles.error}>검수 목록을 불러오지 못했습니다.</p>
      ) : pending === 0 ? (
        <p className={styles.empty}>검수할 그림이 없습니다.</p>
      ) : (
        <>
          {queue.images.length > 0 && (
            <section className={styles.panel}>
              <h2>장면 그림 {queue.images.length}장</h2>
              <ul className={styles.gallery}>
                {queue.images.map((img) => (
                  <li key={img.id} className={styles.card}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- 운영자 전용 중계 그림 */}
                    <img src={`/api/worlds/${img.world.id}/images/${img.id}`} alt={img.label} />
                    <strong>{img.label}</strong>
                    <Link href={`/worlds/${img.world.id}`} className={styles.sub}>
                      {img.world.title} · {img.world.owner?.email ?? "탈퇴"}
                    </Link>
                    <span className={styles.sub}>
                      {formatDayTime(img.createdAt)}
                      {img.reviewNote ? ` · ${img.reviewNote}` : ""}
                    </span>
                    <ImageDecision imageId={img.id} review="PENDING" blocked={false} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {queue.maps.length > 0 && (
            <section className={styles.panel}>
              <h2>코퍼맵 지도 {queue.maps.length}장</h2>
              <ul className={styles.gallery}>
                {queue.maps.map((m) => (
                  <li key={m.id} className={styles.card}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- 운영자 전용 중계 그림 */}
                    <img src={`/api/worlds/${m.id}/map`} alt={`${m.title} 지도`} />
                    <Link href={`/worlds/${m.id}`} className={styles.titleLink}>
                      {m.title}
                    </Link>
                    <span className={styles.sub}>{m.owner?.email ?? "탈퇴"}</span>
                    <MapDecision id={m.id} review="PENDING" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
