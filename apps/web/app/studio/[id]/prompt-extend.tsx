"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ChoiceDialog from "@/components/choice-dialog";
import styles from "./studio-editor.module.css";

// 프로 등급에서 긴 글 칸의 글자 수를 늘려 주는 배수 (이름·호칭처럼 짧은 칸은 대상이 아니다)
export const PRO_MULTIPLIER = 3;

// 프롬프트 연장: 무료 등급에서 누르면 프로 안내를 띄우고 요금 안내로 보낸다 (프로는 이미 3배라 버튼 대신 표시만 한다)
export default function PromptExtendButton({ label, max }: { label: string; max: number }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        className={styles.extendButton}
        onClick={() => setOpen(true)}
        aria-label={`${label} 프롬프트 연장`}
        title={`프로 등급에서는 ${(max * PRO_MULTIPLIER).toLocaleString("ko-KR")}자까지 쓸 수 있어요`}
      >
        프롬프트 연장
      </button>
      <ChoiceDialog
        open={open}
        title="이 기능을 사용하실려면 프로등급으로 전환해야 합니다."
        onClose={() => setOpen(false)}
        choices={[
          { label: "요금 안내 보기", tone: "primary", onSelect: () => router.push("/pricing") },
          { label: "닫기", onSelect: () => setOpen(false) },
        ]}
      >
        프로 등급에서는 이름·호칭을 뺀 긴 글 칸의 글자 수를 {PRO_MULTIPLIER}배로 늘릴 수 있어요. 이 칸({label})은{" "}
        {max.toLocaleString("ko-KR")}자 → {(max * PRO_MULTIPLIER).toLocaleString("ko-KR")}자가 됩니다. 요금 안내에서 프로 기간을 결제할
        수 있어요(자동 결제 없음). 쓰던 글은 그대로 남아요.
      </ChoiceDialog>
    </>
  );
}
