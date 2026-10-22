import "server-only";

import { API_BASE_URL, getSessionToken } from "./auth";

export type Persona = {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
};

export const PERSONA_NAME_MAX = 20;
export const PERSONA_DESCRIPTION_MAX = 300;
export const PERSONA_LIMIT = 10;

export async function getMyPersonas(): Promise<Persona[]> {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/me/personas`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as Persona[]) : [];
  } catch {
    return [];
  }
}
