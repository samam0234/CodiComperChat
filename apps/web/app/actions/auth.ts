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
  if (!result.ok) return { error: result.error };
  // 비밀번호를 바꾸면 이전 토큰이 모두 무효가 된다. 이 기기는 새 토큰으로 이어 간다
  await startSession(result.data);
  return { success: "비밀번호를 바꿨습니다. 다른 기기에서는 다시 로그인해야 합니다." };
}

// 비밀번호 찾기: 가입 여부를 알려 주지 않도록 결과와 상관없이 같은 안내를 보인다
export async function forgotPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = keep(formData, "email");
  const result = await callApi("/auth/password/forgot", {
    method: "POST",
    body: { email: formData.get("email") },
  });
  if (!result.ok) return { error: result.error, values };
  return {
    success: "가입된 이메일이라면 비밀번호 재설정 링크를 보냈어요. 메일함(스팸함 포함)을 확인해 주세요. 링크는 30분 동안 쓸 수 있어요.",
    values,
  };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("newPassword") !== formData.get("newPasswordConfirm")) {
    return { error: "새 비밀번호 확인이 일치하지 않습니다." };
  }
  const result = await callApi("/auth/password/reset", {
    method: "POST",
    body: { token: formData.get("token"), newPassword: formData.get("newPassword") },
  });
  if (!result.ok) return { error: result.error };
  // 재설정하면 모든 기기의 로그인이 끊기므로 이 브라우저의 옛 쿠키도 지운다
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login?reset=1");
}

// 메일 속 링크를 연 뒤 버튼을 눌러야 인증된다 (메일 보안 검사기가 링크를 미리 열어도 인증되지 않게)
export async function verifyEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await callApi("/auth/verify-email", {
    method: "POST",
    body: { token: formData.get("token") },
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/", "layout");
  return { success: "이메일 인증을 마쳤어요. 이제 공방에서 캐릭터를 발행할 수 있어요." };
}

export async function resendVerification(_prev: FormState): Promise<FormState> {
  const token = await getSessionToken();
  if (!token) redirect("/login?next=/me");
  const result = await callApi("/auth/me/verify-email", { method: "POST", token });
  if (!result.ok) return { error: result.error };
  const already = (result.data as { alreadyVerified?: boolean } | null)?.alreadyVerified;
  return { success: already ? "이미 인증된 이메일이에요." : "인증 메일을 다시 보냈어요. 메일함(스팸함 포함)을 확인해 주세요." };
}
