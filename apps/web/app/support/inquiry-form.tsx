"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendInquiry, type Inquiry } from "@/app/actions/support";
import styles from "./support.module.css";

const CATEGORIES = [
  { value: "ACCOUNT", label: "계정" },
  { value: "BILLING", label: "결제·환불" },
  { value: "CHARACTER", label: "캐릭터·신고" },
  { value: "BUG", label: "오류" },
  { value: "OTHER", label: "기타" },
];

function when(value: string) {
  return new Date(value).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function InquiryForm({ loggedIn, items }: { loggedIn: boolean; items: Inquiry[] }) {
  const router = useRouter();
  const [category, setCategory] = useState("OTHER");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!loggedIn) {
    return (
      <p>
        문의는 로그인한 계정으로 운영자에게 바로 전달됩니다. <Link href="/login?next=/support">로그인</Link>한 뒤 적어 주세요. 비밀번호는 적지 마세요.
      </p>
    );
  }

  return (
    <div>
      <p className={styles.lead}>가입한 계정으로 운영자에게 전달됩니다. 어떤 화면에서 무슨 일이 있었는지 적어 주세요. 비밀번호는 적지 마세요.</p>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await sendInquiry(category, subject, body);
            if (!result.ok) {
              setNotice({ ok: false, text: result.error });
              return;
            }
            setSubject("");
            setBody("");
            setNotice({ ok: true, text: "문의를 보냈습니다. 답변은 이 화면에 남습니다." });
            router.refresh();
          });
        }}
      >
        <label className={styles.label}>
          종류
          <select className={styles.input} value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          제목
          <input className={styles.input} value={subject} maxLength={80} required onChange={(event) => setSubject(event.target.value)} />
        </label>
        <label className={styles.label}>
          내용
          <textarea className={styles.input} value={body} maxLength={2000} rows={5} required onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? "보내는 중…" : "문의 보내기"}
        </button>
        {notice && (
          <p className={notice.ok ? styles.ok : styles.error} role={notice.ok ? "status" : "alert"}>
            {notice.text}
          </p>
        )}
      </form>
      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id}>
              <p>
                <strong>{item.subject}</strong> <span>{item.status === "ANSWERED" ? "답변 완료" : "확인 중"}</span> · {when(item.createdAt)}
              </p>
              <p>{item.body}</p>
              {item.reply && <p className={styles.reply}>운영자: {item.reply}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
