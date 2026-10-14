import Link from "next/link";
import { createDraft } from "@/app/actions/studio";
import { requireUser } from "@/lib/auth";
import { getMyDrafts } from "@/lib/studio";
import styles from "./page.module.css";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("/studio");
  const drafts = await getMyDrafts();
  const { error } = await searchParams;

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>캐릭터 공방</h1>
          <p className={styles.description}>
            7단계 카드로 캐릭터를 만들고, 테스트 대화 3턴으로 말투를 확인합니다.
            {user.role === "ADMIN"
              ? " 테스트를 통과한 캐릭터는 발행해 홈에 올릴 수 있습니다."
              : " v1에서는 운영자만 발행할 수 있어, 만든 캐릭터는 내 초안으로 남습니다."}
          </p>
        </div>
        <form action={createDraft}>
          <button type="submit" className={styles.newButton}>
            새 캐릭터 만들기
          </button>
        </form>
      </div>

      {error === "create" && <p className={styles.notice}>초안을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
      {drafts === null && (
        <p className={styles.notice}>초안 목록을 불러오지 못했습니다. apps/api가 켜져 있는지 확인하세요.</p>
      )}

      {drafts?.length === 0 && (
        <div className={styles.empty}>
          <p>아직 만든 캐릭터가 없습니다.</p>
          <p className={styles.emptyHint}>정체성 → 성격·말투 → 캠페인 역할 → 첫인사, 네 단계만 채우면 테스트할 수 있어요.</p>
        </div>
      )}

      {drafts && drafts.length > 0 && (
        <ul className={styles.list}>
          {drafts.map((d) => (
            <li key={d.id}>
              <Link href={`/studio/${d.id}`} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.name}>{d.name || "이름 없는 초안"}</span>
                  <span className={d.published ? styles.badgePublished : d.complete ? styles.badgeReady : styles.badge}>
                    {d.published ? "발행됨" : d.complete ? "필수 완료" : "작성 중"}
                  </span>
                </div>
                <p className={styles.preview}>{d.oneLiner || "한 줄 소개가 아직 없습니다."}</p>
                <span className={styles.when}>{formatWhen(d.updatedAt)} 저장</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
