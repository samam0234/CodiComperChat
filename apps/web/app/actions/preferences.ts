"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE, THEME_OVERRIDE_COOKIE } from "@/lib/theme";
import { formatOverride, isShade, isThemeMode, nextSwitchAt, type Shade } from "@/lib/theme-schedule";
import type { FormState } from "./auth";

const YEAR = 60 * 60 * 24 * 365;
const DAY_MS = 86_400_000;

// 설정 > 화면: 기본값(시간표 자동 / 밝기 영구 / 다크 영구). 헤더에서 잠깐 바꾼 것은 지운다
export async function saveTheme(_prev: FormState, formData: FormData): Promise<FormState> {
  const mode = formData.get("theme");
  if (!isThemeMode(mode)) return { error: "알 수 없는 테마입니다." };

  const jar = await cookies();
  jar.set(THEME_COOKIE, mode, { path: "/", sameSite: "lax", maxAge: YEAR });
  jar.delete(THEME_OVERRIDE_COOKIE);
  return { success: "화면 테마를 저장했습니다." };
}

// 헤더 버튼: 지금 밝기를 바꾼다.
//  - 영구 설정이면 영구 설정을 반대쪽으로 바꾼다
//  - 자동이면 다음 전환 시각(브라우저가 계산해 보낸 until)까지만 바꾼다. until은 지금부터 하루 안쪽만 믿는다
export async function switchShade(next: Shade, until: number): Promise<void> {
  if (!isShade(next)) return;
  const jar = await cookies();
  const mode = jar.get(THEME_COOKIE)?.value;
  if (mode === "light" || mode === "dark") {
    jar.set(THEME_COOKIE, next, { path: "/", sameSite: "lax", maxAge: YEAR });
    return;
  }
  const now = Date.now();
  const end = Number.isSafeInteger(until) && Math.abs(until - now) <= 2 * DAY_MS ? until : nextSwitchAt(now);
  jar.set(THEME_OVERRIDE_COOKIE, formatOverride({ shade: next, until: end }), {
    path: "/",
    sameSite: "lax",
    // 쿠키 자체는 하루 넉넉히. 실제로 끝나는 시각은 값 안의 until로 서버·브라우저가 각자 판단한다
    maxAge: 60 * 60 * 26,
  });
}
