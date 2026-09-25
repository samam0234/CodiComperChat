"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";
import type { FormState } from "./auth";

async function send(path: string, method: string, body?: unknown): Promise<FormState> {
  const token = await getSessionToken();
  if (!token) redirect("/login?next=/me");

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { error: data?.message ?? `요청이 실패했습니다 (HTTP ${res.status}).` };
  }

  revalidatePath("/me");
  return { success: "저장했습니다." };
}

function fields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
}

export async function createPersona(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = fields(formData);
  const result = await send("/me/personas", "POST", values);
  return result?.error ? { ...result, values } : { success: "프로필 캐릭터를 만들었습니다." };
}

export async function updatePersona(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = fields(formData);
  const id = encodeURIComponent(String(formData.get("id") ?? ""));
  const result = await send(`/me/personas/${id}`, "PATCH", values);
  return result?.error ? { ...result, values } : result;
}

export async function deletePersona(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = encodeURIComponent(String(formData.get("id") ?? ""));
  return send(`/me/personas/${id}`, "DELETE");
}
