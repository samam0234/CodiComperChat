"use client";

import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import styles from "./chat-input.module.css";

// 입력창이 이 줄 수를 넘기면 늘어나지 않고 안에서 스크롤한다
const MAX_LINES = 6;

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  // Enter로 보낼 때 호출된다. 보낼 수 있는 상태인지는 호출부가 판단한다
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
};

// Enter = 보내기, Shift+Enter = 줄바꿈. 한글 입력 중(조합 중)의 Enter는 글자 확정이지 전송이 아니다
export default function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  maxLength,
  inputRef,
}: ChatInputProps) {
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? ownRef;

  // 내용에 맞춰 높이를 늘린다. 보낸 뒤 비워지면 한 줄로 돌아온다
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 비어 있을 때는 안내 문구(placeholder)가 좁은 화면에서 여러 줄로 접혀도 한 줄 높이를 지킨다
    if (value === "") {
      element.style.height = "";
      element.style.overflowY = "hidden";
      return;
    }

    element.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 20;
    const padding =
      parseFloat(getComputedStyle(element).paddingTop) +
      parseFloat(getComputedStyle(element).paddingBottom);
    const max = lineHeight * MAX_LINES + padding;
    element.style.height = `${Math.min(element.scrollHeight, max)}px`;
    element.style.overflowY = element.scrollHeight > max ? "auto" : "hidden";
  }, [value, ref]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    // 조합 중(한글·일본어 등)의 Enter는 전송하지 않는다. keyCode 229는 일부 브라우저의 조합 신호다
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    // 터치 기기에는 Shift가 없다. 화면 키보드의 Enter는 줄바꿈으로 두고 "보내기" 버튼으로 보낸다
    if (window.matchMedia("(pointer: coarse)").matches) return;

    event.preventDefault();
    onSubmit();
  };

  return (
    <textarea
      ref={ref}
      className={styles.input}
      rows={1}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      aria-label="메시지 입력"
      aria-keyshortcuts="Enter Shift+Enter"
      maxLength={maxLength}
      disabled={disabled}
    />
  );
}
