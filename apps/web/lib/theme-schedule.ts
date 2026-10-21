// 테마 시간표 (2026-10-22 사용자 결정): 서버(첫 화면)와 브라우저(시간이 바뀔 때)가 같은 규칙을 쓴다.
//  - 자동(기본): 한국 시각 오전 7시부터 밝게, 오후 10시부터 어둡게
//  - 밝기 모드 영구 / 다크 모드 영구: 시간과 상관없이 그대로
//  - 헤더 버튼으로 잠깐 바꾸면(자동일 때) 다음 전환 시각까지만 유지하고, 그 뒤로는 시간표로 돌아간다
export type ThemeMode = "auto" | "light" | "dark";
export type Shade = "light" | "dark";

export const THEME_MODES: readonly ThemeMode[] = ["auto", "light", "dark"];
export const DAY_START_HOUR = 7;
export const NIGHT_START_HOUR = 22;

const HOUR_MS = 3_600_000;
const KST_OFFSET_MS = 9 * HOUR_MS;

export const isThemeMode = (value: unknown): value is ThemeMode => THEME_MODES.includes(value as ThemeMode);
export const isShade = (value: unknown): value is Shade => value === "light" || value === "dark";

// 기기 시간대와 상관없이 한국 시각의 "몇 시"
export function kstHour(now: number): number {
  return new Date(now + KST_OFFSET_MS).getUTCHours();
}

export function scheduledShade(now: number): Shade {
  const hour = kstHour(now);
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? "light" : "dark";
}

// 다음 전환 시각(오전 7시 또는 오후 10시, 한국 시각)의 epoch ms
export function nextSwitchAt(now: number): number {
  const kst = new Date(now + KST_OFFSET_MS);
  const dayStart = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - KST_OFFSET_MS;
  for (const hour of [DAY_START_HOUR, NIGHT_START_HOUR, DAY_START_HOUR + 24]) {
    const at = dayStart + hour * HOUR_MS;
    if (at > now) return at;
  }
  return dayStart + (NIGHT_START_HOUR + 24) * HOUR_MS;
}

// 헤더 버튼으로 잠깐 바꾼 것: 무엇으로, 언제까지
export type ThemeOverride = { shade: Shade; until: number };

// 쿠키 값 "dark.1761134400000" ↔ { shade, until }
export function parseOverride(raw: string | undefined): ThemeOverride | null {
  const m = raw?.match(/^(light|dark)\.(\d{10,15})$/);
  return m ? { shade: m[1] as Shade, until: Number(m[2]) } : null;
}

export const formatOverride = (o: ThemeOverride): string => `${o.shade}.${o.until}`;

// 지금 보일 밝기. 영구 설정이 가장 먼저, 그다음 아직 안 끝난 잠깐 바꾸기, 마지막으로 시간표
export function effectiveShade(mode: ThemeMode, override: ThemeOverride | null, now: number): Shade {
  if (mode !== "auto") return mode;
  if (override && now < override.until) return override.shade;
  return scheduledShade(now);
}
