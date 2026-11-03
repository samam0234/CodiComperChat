import Link from "next/link";
import PageHead from "@/components/page-head";
import { adminGet, requireAdmin } from "@/lib/api";
import { formatDayTime } from "@/lib/format-time";
import styles from "./dashboard.module.css";

type Stats = {
  users: { total: number; verified: number; new7d: number; admins: number; pro: number };
  characters: { published: number; public: number; takenDown: number; drafts: number };
  moderation: { openReports: number; openContentReports: number; reportedCharacters: number; pendingPortraits: number };
  activity: { activeConversations: number; messages24h: number };
  ai: { inFlight: number; waitingForeground: number; waitingBackground: number; concurrency: number };
  at: string;
};

function Tile({ label, value, hint, href, alert }: { label: string; value: number | string; hint?: string; href?: string; alert?: boolean }) {
  const body = (
    <>
      <span className={styles.tileLabel}>{label}</span>
      <strong className={styles.tileValue}>{value}</strong>
      {hint && <span className={styles.tileHint}>{hint}</span>}
    </>
  );
  const cls = `${styles.tile} ${alert ? styles.alert : ""}`;
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function Dashboard() {
  await requireAdmin("/");
  const stats = await adminGet<Stats>("/admin/stats");

  if (!stats) {
    return (
      <>
        <PageHead title="대시보드" />
        <p className={styles.error}>통계를 불러오지 못했습니다. apps/api가 켜져 있는지 확인하세요.</p>
      </>
    );
  }

  const { users, characters, moderation, activity, ai } = stats;
  const todo = moderation.openReports + moderation.openContentReports + moderation.pendingPortraits;

  return (
    <>
      <PageHead title="대시보드" description={`지금 상태 · ${formatDayTime(stats.at)} 기준`} />

      <section aria-label="할 일" className={styles.section}>
        <h2 className={styles.sectionTitle}>
          처리할 일 <span className={todo > 0 ? styles.badgeAlert : styles.badge}>{todo}</span>
        </h2>
        <div className={styles.grid}>
          <Tile label="열린 신고" value={moderation.openReports} hint={`캐릭터 ${moderation.reportedCharacters}개`} href="/reports" alert={moderation.openReports > 0} />
          <Tile label="그림 신고" value={moderation.openContentReports} href="/content" alert={moderation.openContentReports > 0} />
          <Tile label="초상 검수 대기" value={moderation.pendingPortraits} href="/portraits" alert={moderation.pendingPortraits > 0} />
          <Tile label="내려간 캐릭터" value={characters.takenDown} href="/characters?filter=taken-down" />
        </div>
      </section>

      <section aria-label="이용자" className={styles.section}>
        <h2 className={styles.sectionTitle}>이용자</h2>
        <div className={styles.grid}>
          <Tile label="전체 계정" value={users.total} hint={`최근 7일 가입 ${users.new7d}`} />
          <Tile label="이메일 인증" value={users.verified} hint={users.total ? `${Math.round((users.verified / users.total) * 100)}%` : undefined} />
          <Tile label="프로" value={users.pro} href="/users" />
          <Tile label="운영자" value={users.admins} />
        </div>
      </section>

      <section aria-label="캐릭터·대화" className={styles.section}>
        <h2 className={styles.sectionTitle}>캐릭터 · 대화</h2>
        <div className={styles.grid}>
          <Tile label="발행된 캐릭터" value={characters.published} hint={`공개 ${characters.public}`} href="/characters" />
          <Tile label="공방 초안" value={characters.drafts} />
          <Tile label="진행 중인 대화" value={activity.activeConversations} />
          <Tile label="최근 24시간 메시지" value={activity.messages24h} />
        </div>
      </section>

      <section aria-label="AI 대기열" className={styles.section}>
        <h2 className={styles.sectionTitle}>AI 호출 대기열 (이 API 서버)</h2>
        <div className={styles.grid}>
          <Tile label="처리 중" value={`${ai.inFlight} / ${ai.concurrency}`} alert={ai.inFlight >= ai.concurrency} />
          <Tile label="기다리는 답" value={ai.waitingForeground} alert={ai.waitingForeground > 0} />
          <Tile label="배경 정리 대기" value={ai.waitingBackground} />
        </div>
        <p className={styles.note}>기다리는 답이 계속 쌓이면 모델이 밀리는 것이다 — Ollama 상태와 AI_CONCURRENCY를 확인한다.</p>
      </section>
    </>
  );
}
