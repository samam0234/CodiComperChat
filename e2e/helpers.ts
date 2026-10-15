import type { BrowserContext, Page } from "@playwright/test";
import pg from "pg";
import { E2E_DB, URLS } from "./env.mjs";

export const OFFICIAL_ID = "e2e-official";

let counter = 0;
const stamp = Date.now();
export const uniq = (tag: string) => `${tag}${stamp % 100000}${++counter}`;

type Init = { method?: string; token?: string; json?: unknown; raw?: { type: string; body: Buffer } };

// Nest를 직접 부른다. 화면이 아니라 "준비"(계정·초안·데이터)에 쓰고, 화면에서 확인할 것만 브라우저로 한다
export async function api<T = any>(path: string, init: Init = {}): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = {};
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  let body: BodyInit | undefined;
  if (init.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  } else if (init.raw) {
    headers["Content-Type"] = init.raw.type;
    body = new Uint8Array(init.raw.body);
  }
  const res = await fetch(URLS.api + path, { method: init.method ?? (body ? "POST" : "GET"), headers, body });
  const type = res.headers.get("content-type") ?? "";
  const parsed = res.status === 204 ? null : type.includes("json") ? await res.json().catch(() => null) : Buffer.from(await res.arrayBuffer());
  return { status: res.status, body: parsed as T };
}

export type User = { email: string; token: string; name: string };

export async function signup(tag = "user"): Promise<User> {
  const name = uniq(tag);
  // 화면에서 같은 이메일로 로그인해도 되도록 아이디 부분은 영문·숫자만 쓴다
  const email = `${uniq("u")}@e2e.test`;
  const res = await api<{ token: string }>("/auth/signup", { json: { email, password: "pass1234word", displayName: name } });
  if (res.status !== 201 && res.status !== 200) throw new Error(`가입 실패 ${res.status}`);
  return { email, token: res.body.token, name };
}

// 로그인한 브라우저로 만든다 (웹의 httpOnly 세션 쿠키를 직접 심는다)
export async function loginAs(context: BrowserContext, user: User) {
  await context.addCookies([{ name: "session", value: user.token, url: URLS.web, httpOnly: true }]);
}

export async function signedInPage(context: BrowserContext, user: User): Promise<Page> {
  await loginAs(context, user);
  return context.newPage();
}

export async function sql<T = any>(query: string, params: unknown[] = []): Promise<T[]> {
  const client = new pg.Client({ connectionString: E2E_DB });
  await client.connect();
  try {
    return (await client.query(query, params)).rows;
  } finally {
    await client.end();
  }
}

export async function makeAdmin(user: User) {
  await sql(`update users set role = 'ADMIN' where email = $1`, [user.email]);
}

// 요금 등급을 직접 바꾼다 (결제가 없어 운영자가 부여하는 것과 같은 효과). until을 주면 그때까지만 PRO.
// 시각은 ISO 문자열(UTC)로 넘긴다 — Date 객체를 그대로 주면 pg가 현지 시각으로 써서 시간대만큼 어긋난다
export async function setPlan(user: User, plan: "FREE" | "PRO", until: Date | null = null) {
  await sql(`update users set plan = $1::"UserPlan", "planUntil" = $2 where email = $3`, [plan, until?.toISOString() ?? null, user.email]);
}

export async function createPersona(user: User, name = "민준") {
  const res = await api<{ id: string }>("/me/personas", { token: user.token, json: { name, description: "시험용 주인공" } });
  return res.body.id;
}

export async function chat(user: User, characterId: string, personaId: string, message: string) {
  return api<{ reply: string }>(`/characters/${characterId}/chat`, { token: user.token, json: { message, personaId } });
}

// 공방 초안 하나를 필수 단계까지 채운 카드로 만든다 (공개 범위 기본은 비공개)
export function fullCard(name: string) {
  return {
    identity: { name, oneLiner: "골목 끝 카페를 혼자 꾸리는 바리스타", role: "guide", occupation: "바리스타", apparentAge: "30대", tags: ["카페"] },
    appearance: { description: "앞치마, 짧은 머리", keywords: ["차분함"] },
    personality: { warmth: 70, directness: 30, impulse: 20, protectiveness: 60, honorific: "jondae", addressing: "손님이라 부른다", habits: ["말끝을 흐린다"], forbidden: ["인터넷 말투"], summary: "말수가 적지만 다정하다" },
    campaign: { scene: "비 오는 오후의 카페", knows: "단골들의 취향", unknown: "유저의 사정", goal: "가게를 지키는 것", stance: "조심스럽게 마음을 연다", conflictSeed: "재개발 소식" },
    boundary: { secret: "가게를 곧 닫아야 한다", unlockCondition: "유저가 먼저 가게 걱정을 할 때", neverDo: ["AI라고 말하기"], breakers: "" },
    greeting: { firstMessage: "창밖에 비가 그치지 않는다. 지우가 컵을 닦다 고개를 든다.\n\"오늘도 오셨네요.\"", alternates: [], examples: [] },
    lore: { world: "", person: "", taboo: "", extra: [] },
  };
}

// 초안 만들기 → 카드 저장 → 3턴 테스트 → 판정 통과까지 (가짜 LLM이라 항상 통과한다)
export async function passedDraft(user: User, name: string) {
  const { body } = await api<{ id: string }>("/studio/characters", { token: user.token, method: "POST" });
  const id = body.id;
  await api(`/studio/characters/${id}`, { token: user.token, method: "PATCH", json: { card: fullCard(name) } });
  for (const message of ["안녕하세요", "오늘 비가 오네요", "고마워요"]) {
    await api(`/studio/characters/${id}/test/chat`, { token: user.token, json: { message } });
  }
  await api(`/studio/characters/${id}/test/critique`, { token: user.token, method: "POST" });
  return id;
}

export async function publishedCharacter(user: User, name: string, visibility: "PUBLIC" | "UNLISTED" | "PRIVATE" = "PUBLIC") {
  const draftId = await passedDraft(user, name);
  await api(`/studio/characters/${draftId}/visibility`, { token: user.token, method: "PATCH", json: { visibility } });
  const published = await api<{ characterId: string }>(`/studio/characters/${draftId}/publish`, { token: user.token, method: "POST" });
  return { draftId, characterId: published.body.characterId };
}
