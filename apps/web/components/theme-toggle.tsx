"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { switchShade } from "@/app/actions/preferences";
import {
  DAY_START_HOUR,
  NIGHT_START_HOUR,
  effectiveShade,
  nextSwitchAt,
  type Shade,
  type ThemeMode,
  type ThemeOverride,
} from "@/lib/theme-schedule";
import styles from "./site-header.module.css";

const apply = (shade: Shade) => {
  document.documentElement.dataset.theme = shade;
};

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.6 8.6 0 1 0 10.8 10.8Z" />
    </svg>
  );
}

// 헤더의 밝기 버튼. 자동(기본)이면 한국 시각 오전 7시에 밝게, 오후 10시에 어둡게 저절로 바뀐다 (lib/theme-schedule.ts).
// 첫 화면은 서버가 그리고, 열어 둔 채 시간이 지나면 여기서 전환 시각에 맞춰 바꾼다
export default function ThemeToggle({
  mode: initialMode,
  override: initialOverride,
  shade: initialShade,
}: {
  mode: ThemeMode;
  override: ThemeOverride | null;
  shade: Shade;
}) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [override, setOverride] = useState(initialOverride);
  const [shade, setShade] = useState(initialShade);
  const [, startTransition] = useTransition();

  // 서버에서 새 값이 오면(설정 저장·새로고침) 따라간다
  useEffect(() => {
    setMode(initialMode);
    setOverride(initialOverride);
  }, [initialMode, initialOverride]);

  // 이 기기의 시계로 다시 계산하고, 다음 전환 시각(또는 잠깐 바꾼 것이 끝나는 시각)에 또 계산한다
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const now = Date.now();
      const next = effectiveShade(mode, override, now);
      apply(next);
      setShade(next);
      if (mode !== "auto") return;
      const ends = [nextSwitchAt(now), ...(override && override.until > now ? [override.until] : [])];
      // 브라우저 타이머의 최대 지연(약 24.8일)보다 훨씬 짧다. 1초 여유를 둬 경계 직전에 깨지 않게
      timer = setTimeout(tick, Math.max(1000, Math.min(...ends) - now + 1000));
    };
    tick();
    return () => clearTimeout(timer);
  }, [mode, override]);

  const onClick = () => {
    const next: Shade = shade === "dark" ? "light" : "dark";
    const until = nextSwitchAt(Date.now());
    apply(next);
    setShade(next);
    if (mode === "auto") setOverride({ shade: next, until });
    else setMode(next);
    startTransition(async () => {
      await switchShade(next, until);
      router.refresh();
    });
  };

  const label = shade === "dark" ? "밝기 모드로 바꾸기" : "다크 모드로 바꾸기";
  const hint =
    mode === "auto"
      ? `자동: 오전 ${DAY_START_HOUR}시 밝게 · 오후 ${NIGHT_START_HOUR - 12}시 어둡게 (한국 시각). 누르면 다음 전환까지 바꿉니다`
      : `${mode === "dark" ? "다크" : "밝기"} 모드 영구 설정 중 (설정 > 화면에서 바꿀 수 있어요)`;

  return (
    <button type="button" className={styles.themeButton} onClick={onClick} aria-label={label} title={`${label} — ${hint}`}>
      {shade === "dark" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
