import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMyPersonas } from "@/lib/personas";
import { getDraft } from "@/lib/studio";
import StudioEditor from "./studio-editor";
import styles from "./studio-editor.module.css";

export default async function StudioDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/studio/${id}`);
  const [draft, personas] = await Promise.all([getDraft(id), getMyPersonas()]);

  if (!draft) {
    return (
      <div className={styles.missing}>
        <p>초안을 찾을 수 없습니다. 지워졌거나 내 초안이 아닙니다.</p>
        <Link href="/studio" className={styles.linkButton}>
          공방 목록으로
        </Link>
      </div>
    );
  }

  return (
    <StudioEditor
      initial={draft}
      personas={personas.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
