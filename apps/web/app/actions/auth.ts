"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  API_BASE_URL,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  getSessionToken,
  safeNextPath,
} from "@/lib/auth";
import { forwardedFor } from "@/lib/client-ip";

// values: 오류 뒤 React가 폼을 비워도 다시 채울 입력값. 비밀번호는 절대 담지 않는다
export type FormState =
  | { error?: string; success?: string; values?: Record<string, string> }
  | undefined;

function keep(formData: FormData, ...names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, String(formData.get(name) ?? "")]));
}

type ApiResult = { ok: true; data: unknown } | { ok: false; error: string };

async function callApi(
  path: string,
  init: { method: string; body?: unknown; token?: string },
): Promise<ApiResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
        // 로그인·가입의 IP 기준 한도가 이용자별로 세어지도록 실제 IP를 넘긴다
        ...(await forwardedFor()),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }

  const data: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.ok) return { ok: true, data };

  const message =
    data && typeof data === "object" && "message" in data
      ? String((data as { message: unknown }).message)
      : `요청이 실패했습니다 (HTTP ${res.status}).`;
  return { ok: false, error: message };
}

async function startSession(data: unknown) {
  const token = (data as { token?: unknown } | null)?.token;
  if (typeof token !== "string") throw new Error("API가 토큰을 돌려주지 않았습니다.");

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // 개발 중 LAN IP(http)로 접속해도 로그인되게 운영에서만 https 전용으로 둔다
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await callApi("/auth/login", {
    method: "POST",
    body: { email: formData.get("email"), password: formData.get("password") },
  });
  if (!result.ok) return { error: result.error, values: keep(formData, "email") };

  await startSession(result.data);
  redirect(safeNextPath(formData.get("next")));
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = keep(formData, "email", "displayName");
  if (formData.get("password") !== formData.get("passwordConfirm")) {
    return { error: "비밀번호 확인이 일치하지 않습니다.", values };
  }

  const result = await callApi("/auth/signup", {
    method: "POST",
    body: {
      email: formData.get("email"),
      password: formData.get("password"),
      displayName: formData.get("displayName"),
    },
  });
  if (!result.ok) return { error: result.error, values };

  await startSession(result.data);
  redirect(safeNextPath(formData.get("next")));
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}

export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = await getSessionToken();
  if (!token) redirect("/login?next=/settings");

  const result = await callApi("/auth/me", {
    method: "PATCH",
    token,
    body: { displayName: formData.get("displayName") },
  });
  if (!result.ok) return { error: result.error, values: keep(formData, "displayName") };

  // 헤더·마이페이지의 이름도 바로 바뀌게 레이아웃째 다시 그린다
  revalidatePath("/", "layout");
  return { success: "표시 이름을 바꿨습니다." };
}

export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = await getSessionToken();
  if (!token) redirect("/login?next=/settings");

  if (formData.get("newPassword") !== formData.get("newPasswordConfirm")) {
    return { error: "새 비밀번호 확인이 일치하지 않습니다." };
  }

  const result = await callApi("/auth/me/password", {
    method: "POST",
    token,
    body: {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
    },
  });
  return result.ok ? { success: "비밀번호를 바꿨습니다." } : { error: result.error };
}
