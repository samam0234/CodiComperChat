"use client";

import { useState } from "react";
import ChoiceDialog from "@/components/choice-dialog";
import styles from "./studio-editor.module.css";

// 프로 등급에서 긴 글 칸의 글자 수를 늘려 주는 배수 (이름·호칭처럼 짧은 칸은 대상이 아니다)
export const PRO_MULTIPLIER = 3;

// 프롬프트 연장: 프로 등급 전용 기능의 자리. 아직 결제·등급이 없어 안내 상자만 띄운다
export default function PromptExtendButton({ label, max }: { label: string; max: number }) {
  const [open, setOpen] = useState(false);
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
        choices={[{ label: "확인", tone: "primary", onSelect: () => setOpen(false) }]}
      >
        프로 등급에서는 이름·호칭을 뺀 긴 글 칸의 글자 수를 {PRO_MULTIPLIER}배로 늘릴 수 있어요. 이 칸({label})은{" "}
        {max.toLocaleString("ko-KR")}자 → {(max * PRO_MULTIPLIER).toLocaleString("ko-KR")}자가 됩니다. 프로 등급은 준비
        중입니다.
      </ChoiceDialog>
    </>
  );
}
