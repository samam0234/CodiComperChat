import "server-only";

import { cookies } from "next/headers";
import {
  effectiveShade,
  isThemeMode,
  parseOverride,
  type Shade,
  type ThemeMode,
  type ThemeOverride,
} from "./theme-schedule";

// theme: 설정의 기본값(auto·light·dark). 예전 값 "system"이나 없으면 auto(시간표)
export const THEME_COOKIE = "theme";
// theme_override: 헤더 버튼으로 잠깐 바꾼 밝기와 끝나는 시각 (자동일 때만 쓴다)
export const THEME_OVERRIDE_COOKIE = "theme_override";

export type ThemeState = { mode: ThemeMode; override: ThemeOverride | null; shade: Shade };

export async function getThemeState(now: number = Date.now()): Promise<ThemeState> {
  const jar = await cookies();
  const raw = jar.get(THEME_COOKIE)?.value;
  const mode = isThemeMode(raw) ? raw : "auto";
  const override = mode === "auto" ? parseOverride(jar.get(THEME_OVERRIDE_COOKIE)?.value) : null;
  return { mode, override, shade: effectiveShade(mode, override, now) };
}
