import type { Metadata } from "next";
import PageHead from "@/components/page-head";
import { adminGet, requireAdmin } from "@/lib/api";
import { formatDayTime } from "@/lib/format-time";
import ReplyBox from "./reply-box";
import styles from "./inquiries.module.css";

export const metadata: Metadata = { title: "고객 문의 · 운영 콘솔" };

type Inquiry = {
  id: string;
  category: string;
  subject: string;
  body: string;
  status: "OPEN" | "ANSWERED";
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  user: { email: string; displayName: string };
};

type Queue = { categories: { value: string; label: string }[]; open: Inquiry[]; answered: Inquiry[] };

const labelOf = (categories: Queue["categories"], value: string) => categories.find((item) => item.value === value)?.label ?? value;

function Card({ item, categories, canReply }: { item: Inquiry; categories: Queue["categories"]; canReply: boolean }) {
  return (
    <article className={styles.card}>
      <p className={styles.meta}>
        {labelOf(categories, item.category)} · {item.user.displayName} ({item.user.email}) · {formatDayTime(item.createdAt)}
      </p>
      <h2>{item.subject}</h2>
      <p className={styles.body}>{item.body}</p>
      {item.reply && <p className={styles.body}>답변: {item.reply}</p>}
      {canReply && <ReplyBox id={item.id} />}
    </article>
  );
}

export default async function InquiriesPage() {
  await requireAdmin("/inquiries");
  const view = await adminGet<Queue>("/admin/support-inquiries");
  if (!view) return <p className={styles.error}>문의를 불러오지 못했습니다. apps/api가 켜져 있는지 확인하세요.</p>;

  return (
    <>
      <PageHead title="고객 문의" description="고객센터에서 이용자가 보낸 글입니다. 답변은 고객센터 화면에 다시 보입니다." />
      <h2 className={styles.sectionTitle}>기다리는 문의 {view.open.length}</h2>
      <div className={styles.list}>
        {view.open.length === 0 && <p className={styles.meta}>기다리는 문의가 없습니다.</p>}
        {view.open.map((item) => (
          <Card key={item.id} item={item} categories={view.categories} canReply />
        ))}
      </div>
      <h2 className={styles.sectionTitle}>답한 문의</h2>
      <div className={styles.list}>
        {view.answered.map((item) => (
          <Card key={item.id} item={item} categories={view.categories} canReply />
        ))}
      </div>
    </>
  );
}
