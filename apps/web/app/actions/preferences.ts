"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import type { FormState } from "./auth";

export async function saveTheme(_prev: FormState, formData: FormData): Promise<FormState> {
  const theme = formData.get("theme");
  if (!isTheme(theme)) return { error: "알 수 없는 테마입니다." };

  (await cookies()).set(THEME_COOKIE, theme, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { success: "화면 테마를 저장했습니다." };
}
