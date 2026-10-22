import { expect, test } from "@playwright/test";
import { OFFICIAL_ID, api, chat, createPersona, signedInPage, signup, type User } from "../helpers";

const CHAT = `/characters/${OFFICIAL_ID}/chat`;
const OPS = `${CHAT}/ops`;

const attend = (user: User) => api("/me/attendance", { token: user.token, method: "POST" });
const balance = async (user: User) => (await api<{ balance: number }>("/me/credits", { token: user.token })).body.balance;

// 대화를 하나 시작해 둔 계정 (오퍼레이션은 진행 중인 대화가 있어야 한다)
async function talking(tag: string, credits = true) {
  const user = await signup(tag);
  const personaId = await createPersona(user, "민준");
  expect((await chat(user, OFFICIAL_ID, personaId, "안녕하세요 선생님")).status).toBe(200);
  if (credits) await attend(user);
  return { user, personaId };
}

test.describe("오퍼레이션 · 심리 탐구", () => {
  test("대화 전에는 못 쓰고(코레딧도 그대로), 대화 중에는 30 코레딧으로 속마음을 엿본다", async () => {
    const fresh = await signup("심리전");
    await attend(fresh);
    const before = await api<{ started: boolean; cost: number }>(`${OPS}/mind`, { token: fresh.token });
    expect(before.body).toMatchObject({ started: false, cost: 30 });
    const blocked = await api<{ message: string }>(`${OPS}/mind`, { token: fresh.token, method: "POST" });
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toContain("먼저");
    expect(await balance(fresh)).toBe(1000);

    const { user } = await talking("심리중");
    const read = await api<{ reading: { innerVoice: string; feeling: string; aboutUser: string }; balance: number }>(`${OPS}/mind`, {
      token: user.token,
      method: "POST",
    });
    expect(read.status).toBe(200);
    expect(read.body.reading.feeling).toBe("설렘");
    expect(read.body.reading.innerVoice.length).toBeGreaterThan(0);
    expect(read.body.balance).toBe(970);

    const view = await api<{ started: boolean; readings: unknown[]; balance: number }>(`${OPS}/mind`, { token: user.token });
    expect(view.body).toMatchObject({ started: true, balance: 970 });
    expect(view.body.readings).toHaveLength(1);

    const ledger = await api<{ history: { reason: string; delta: number; modelId: string | null }[] }>("/me/credits", { token: user.token });
    expect(ledger.body.history[0]).toMatchObject({ reason: "OPERATION", delta: -30, modelId: "op:mind" });
  });

  test("코레딧이 모자라면 403", async () => {
    const { user } = await talking("심리가난", false);
    const res = await api<{ message: string }>(`${OPS}/mind`, { token: user.token, method: "POST" });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain("코레딧");
  });

  test("화면: 입력창 위 오퍼레이션 메뉴 → 심리 탐구 → 속마음 엿보기", async ({ browser }) => {
    const { user } = await talking("심리화면");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "오퍼레이션" }).click();
    const menu = page.getByRole("menu", { name: "오퍼레이션" });
    await menu.getByRole("menuitem", { name: /심리 탐구/ }).click();
    await expect(page).toHaveURL(`${CHAT}/mind`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("머릿속");

    await page.getByRole("button", { name: /속마음 엿보기/ }).click();
    const list = page.getByRole("list", { name: "엿본 속마음" });
    await expect(list.getByText("설렘")).toBeVisible();
    await expect(list).toContainText("오늘따라 믿음직해 보인다.");
    await expect(page.getByText("970", { exact: true })).toBeVisible();
  });
});
