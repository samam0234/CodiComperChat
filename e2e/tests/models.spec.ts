import { expect, test } from "@playwright/test";
import { OFFICIAL_ID, api, createPersona, setPlan, signedInPage, signup } from "../helpers";

const CHAT = `/characters/${OFFICIAL_ID}/chat`;

type Reply = {
  reply: string;
  model: string;
  usage: { used: number; limit: number } | null;
  credits: { spent: number; balance: number } | null;
  message?: string;
};
type ModelRow = { id: string; tier: string; credits: number | null; locked: string | null; used: number | null; limit: number | null };

// e2e API 서버는 강화 무료 모델의 하루 한도를 2로 줄이고, 프리미엄 호출을 가짜 LLM으로 보낸다 (e2e/servers/api.mjs)
const LIMIT = 2;
const OPUS = { id: "claude-opus-5-5", credits: 75 };

async function send(user: Awaited<ReturnType<typeof signup>>, personaId: string, message: string, model?: string) {
  return api<Reply>(`/characters/${OFFICIAL_ID}/chat`, {
    token: user.token,
    json: { message, personaId, ...(model ? { model } : {}) },
  });
}

async function models(user: Awaited<ReturnType<typeof signup>>) {
  return (await api<{ default: string; balance: number; models: ModelRow[] }>("/models", { token: user.token })).body;
}

test.describe("모델 선택", () => {
  test("목록: 프리미엄은 모델마다 코레딧 값이 있고 잔액이 모자라면 잠긴다. 강화 무료는 프로면 무제한", async () => {
    const free = await signup("모델무료");
    const pro = await signup("모델프로");
    await setPlan(pro, "PRO");

    const list = await models(free);
    expect(list.default).toBe("basic");
    expect(list.balance).toBe(0);
    expect(list.models).toHaveLength(13);
    const byId = new Map(list.models.map((m) => [m.id, m]));
    expect(byId.get("basic")).toMatchObject({ locked: null, credits: null });
    expect(byId.get("enhanced")).toMatchObject({ locked: null, used: 0, limit: LIMIT });
    expect(byId.get(OPUS.id)).toMatchObject({ credits: OPUS.credits, locked: "NO_CREDITS" });
    expect(byId.get("claude-haiku-5-5")?.credits).toBe(8);
    expect(byId.get("claude-fable-5-1")?.credits).toBe(120);

    // 프로는 강화 무료에 한도가 없다
    expect((await models(pro)).models.find((m) => m.id === "enhanced")).toMatchObject({ locked: null, limit: null, used: null });

    expect((await api("/models")).status).toBe(401);
  });

  test("강화 무료: 무료 등급은 하루 한도까지, 넘으면 거절하고 기본 모델은 계속 된다. 고른 모델은 대화에 저장된다", async () => {
    const user = await signup("모델한도");
    const personaId = await createPersona(user);

    const first = await send(user, personaId, "첫 번째", "enhanced");
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ model: "enhanced", usage: { used: 1, limit: LIMIT } });
    const history = await api<{ model: string }>(`/characters/${OFFICIAL_ID}/chat`, { token: user.token });
    expect(history.body.model).toBe("enhanced");

    // 모델을 안 적으면 대화에 저장된 모델로 이어 간다
    const second = await send(user, personaId, "두 번째");
    expect(second.body).toMatchObject({ model: "enhanced", usage: { used: 2, limit: LIMIT } });

    const third = await send(user, personaId, "세 번째", "enhanced");
    expect(third.status).toBe(403);
    expect(third.body.message).toContain("오늘");
    expect((await models(user)).models.find((m) => m.id === "enhanced")).toMatchObject({ used: LIMIT, locked: "DAILY_LIMIT" });

    // 모델을 안 적었는데 저장된 모델이 한도에 닿았으면 기본 모델로 내려가 대화는 이어진다
    const fallback = await send(user, personaId, "네 번째");
    expect(fallback.status).toBe(200);
    expect(fallback.body).toMatchObject({ model: "basic", usage: null, credits: null });
  });

  test("강화 무료: 프로 등급은 한도 없이 쓴다", async () => {
    const user = await signup("모델무제한");
    await setPlan(user, "PRO");
    const personaId = await createPersona(user);
    for (let i = 0; i < LIMIT + 2; i++) {
      const res = await send(user, personaId, `프로 ${i}`, "enhanced");
      expect(res.status).toBe(200);
      expect(res.body.usage).toBeNull();
    }
  });

  test("프리미엄: 답 1번마다 코레딧을 쓰고, 모자라면 거절한다 (거절된 턴은 코레딧이 줄지 않는다)", async () => {
    const user = await signup("모델코레딧");
    const personaId = await createPersona(user);

    const poor = await send(user, personaId, "안녕", OPUS.id);
    expect(poor.status).toBe(403);
    expect(poor.body.message).toContain("코레딧");

    expect((await api<{ credited: number }>("/me/attendance", { token: user.token, method: "POST" })).body.credited).toBe(1000);
    const rich = await send(user, personaId, "안녕", OPUS.id);
    expect(rich.status).toBe(200);
    expect(rich.body).toMatchObject({ model: OPUS.id, credits: { spent: OPUS.credits, balance: 1000 - OPUS.credits } });

    const summary = await api<{ balance: number; history: { reason: string; delta: number; modelId: string | null }[] }>("/me/credits", { token: user.token });
    expect(summary.body.balance).toBe(1000 - OPUS.credits);
    expect(summary.body.history.slice(0, 2)).toEqual([
      expect.objectContaining({ reason: "MODEL_USE", delta: -OPUS.credits, modelId: OPUS.id }),
      expect.objectContaining({ reason: "ATTENDANCE", delta: 1000 }),
    ]);

    expect((await send(user, personaId, "안녕", "gpt-nothing")).status).toBe(400);
  });

  test("대화 화면: 모델을 고르고 보내면 오늘 횟수·코레딧이 바뀌고, 한도를 넘으면 안내가 나온다", async ({ browser }) => {
    const user = await signup("모델화면");
    await createPersona(user, "민준");
    const context = await browser.newContext();
    const page = await signedInPage(context, user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");

    const select = page.locator("#model-select");
    await expect(select).toHaveValue("basic");
    // 코레딧이 없으면 프리미엄은 보이지만 고를 수 없다
    const opus = select.locator(`option[value="${OPUS.id}"]`);
    await expect(opus).toBeDisabled();
    await expect(opus).toHaveText(`Claude Opus 5.5 · ${OPUS.credits} 코레딧 · 코레딧 부족`);
    await expect(page.getByRole("link", { name: "내 코레딧 0" })).toHaveAttribute("href", "/me");
    await expect(select.locator('option[value="enhanced"]')).toHaveText(`강화 무료 모델 · 오늘 0/${LIMIT}`);

    await page.locator("#persona-select").selectOption({ label: "민준" });
    await select.selectOption("enhanced");
    for (const [n, text] of [[1, "모델 시험 하나"], [2, "모델 시험 둘"]] as const) {
      await page.getByPlaceholder(/에게 말 걸기/).fill(text);
      await page.getByRole("button", { name: "보내기" }).click();
      await expect(page.getByText(/가 답하는 중/)).toBeHidden();
      await expect(select.locator('option[value="enhanced"]')).toHaveText(`강화 무료 모델 · 오늘 ${n}/${LIMIT}`);
    }
    await page.getByPlaceholder(/에게 말 걸기/).fill("모델 시험 셋");
    await page.getByRole("button", { name: "보내기" }).click();
    await expect(page.getByText(/오늘 쓸 수 있는 횟수를 모두 썼어요/)).toBeVisible();

    // 출석하고 오면 프리미엄을 고를 수 있고, 보내면 잔액이 준다
    await api("/me/attendance", { token: user.token, method: "POST" });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#model-select")).toHaveValue("enhanced");
    await page.locator("#model-select").selectOption(OPUS.id);
    await page.getByPlaceholder(/에게 말 걸기/).fill("프리미엄 시험");
    await page.getByRole("button", { name: "보내기" }).click();
    await expect(page.getByText(/가 답하는 중/)).toBeHidden();
    await expect(page.getByRole("link", { name: `내 코레딧 ${(1000 - OPUS.credits).toLocaleString("ko-KR")}` })).toBeVisible();
    await context.close();
  });
});

test.describe("코레딧 출석", () => {
  test("하루 한 번: 무료 1000·프로 5000, 같은 날 두 번은 409", async () => {
    const free = await signup("출석무료");
    const pro = await signup("출석프로");
    await setPlan(pro, "PRO");

    const first = await api<{ credited: number; balance: number }>("/me/attendance", { token: free.token, method: "POST" });
    expect(first.body).toEqual({ credited: 1000, balance: 1000 });
    const again = await api<{ message: string }>("/me/attendance", { token: free.token, method: "POST" });
    expect(again.status).toBe(409);
    expect(again.body.message).toContain("이미 출석");

    expect((await api<{ credited: number }>("/me/attendance", { token: pro.token, method: "POST" })).body.credited).toBe(5000);
    const summary = await api<{ balance: number; attendedToday: boolean; krwPer100: number }>("/me/credits", { token: pro.token });
    expect(summary.body).toMatchObject({ balance: 5000, attendedToday: true, krwPer100: 350 });
  });

  test("마이페이지에서 출석하면 잔액이 오르고 버튼이 잠긴다", async ({ browser }) => {
    const user = await signup("출석화면");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto("/me");
    await page.waitForLoadState("networkidle");
    const card = page.getByRole("region", { name: "코레딧" });
    await expect(card).toContainText("100 코레딧 = 350원");
    await card.getByRole("button", { name: "출석하고 1,000 코레딧 받기" }).click();
    await expect(card.getByRole("status")).toHaveText("출석 완료! 1,000 코레딧을 받았어요.");
    await expect(card).toContainText("1,000 코레딧");
    await expect(card.getByRole("button", { name: "오늘 출석 완료" })).toBeDisabled();
  });
});
