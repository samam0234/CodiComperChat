import "server-only";

import { API_BASE_URL, getSessionToken } from "./auth";
import type { AdminReportsView } from "./reports";

export async function getAdminReports(): Promise<AdminReportsView | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/admin/reports`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    return res.ok ? ((await res.json()) as AdminReportsView) : null;
  } catch {
    return null;
  }
}
