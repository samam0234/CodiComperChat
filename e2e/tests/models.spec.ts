import { expect, test } from "@playwright/test";
import { OFFICIAL_ID, api, createPersona, setPlan, signedInPage, signup } from "../helpers";

const CHAT = `/characters/${OFFICIAL_ID}/chat`;

type Usage = { used: number; limit: number } | null;

// e2e API 서버는 강화 무료 모델의 하루 한도를 2로 줄여 둔다 (e2e/servers/api.mjs)
const LIMIT = 2;

async function send(user: Awaited<ReturnType<typeof signup>>, personaId: string, message: string, model?: string) {
  return api<{ reply: string; model: string; usage: Usage; message?: string }>(`/characters/${OFFICIAL_ID}/chat`, {
    token: user.token,
    json: { message, personaId, ...(model ? { model } : {}) },
  });
}

test.describe("모델 선택", () => {
  test("목록: 무료 등급은 프리미엄이 프로 전용, 프로 등급은 준비 중으로 잠긴다", async () => {
    const free = await signup("모델무료");
    const pro = await signup("모델프로");
    await setPlan(pro, "PRO");

    const list = await api<{ default: string; models: { id: string; tier: string; locked: string | null; used: number | null; limit: number | null }[] }>("/models", { token: free.token });
    expect(list.status).toBe(200);
    expect(list.body.default).toBe("basic");
    const byId = new Map(list.body.models.map((m) => [m.id, m]));
    expect(list.body.models).toHaveLength(13);
    expect(byId.get("basic")?.locked).toBeNull();
    expect(byId.get("enhanced")).toMatchObject({ locked: null, used: 0, limit: LIMIT });
    for (const id of ["claude-haiku-4-5", "claude-opus-5-5", "claude-fable-5-1", "grok-4-7"]) {
      expect(byId.get(id)?.locked).toBe("PRO_ONLY");
    }

    const proList = await api<{ models: { id: string; locked: string | null }[] }>("/models", { token: pro.token });
    expect(proList.body.models.find((m) => m.id === "claude-opus-5-5")?.locked).toBe("NOT_READY");
    expect(proList.body.models.find((m) => m.id === "enhanced")?.locked).toBeNull();

    // 로그인하지 않으면 볼 수 없다
    expect((await api("/models")).status).toBe(401);
  });

  test("강화 무료는 하루 한도까지, 넘으면 거절하고 기본 모델은 계속 된다. 고른 모델은 대화에 저장된다", async () => {
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
    // 거절된 턴은 대화에 남지 않고 횟수도 늘지 않는다
    const after = await api<{ models: { id: string; used: number | null; locked: string | null }[] }>("/models", { token: user.token });
    expect(after.body.models.find((m) => m.id === "enhanced")).toMatchObject({ used: LIMIT, locked: "DAILY_LIMIT" });

    // 모델을 안 적었는데 저장된 모델이 한도에 닿았으면 기본 모델로 내려가 대화는 이어진다
    const fallback = await send(user, personaId, "네 번째");
    expect(fallback.status).toBe(200);
    expect(fallback.body).toMatchObject({ model: "basic", usage: null });
    const explicitBasic = await send(user, personaId, "다섯 번째", "basic");
    expect(explicitBasic.status).toBe(200);
  });

  test("프리미엄은 서버도 막는다 (무료 등급·준비 중·모르는 모델)", async () => {
    const free = await signup("모델잠금");
    const pro = await signup("모델잠금프로");
    await setPlan(pro, "PRO");
    const freePersona = await createPersona(free);
    const proPersona = await createPersona(pro);

    const asFree = await send(free, freePersona, "안녕", "claude-opus-5-5");
    expect(asFree.status).toBe(403);
    expect(asFree.body.message).toContain("프로 등급");

    const asPro = await send(pro, proPersona, "안녕", "grok-4-7");
    expect(asPro.status).toBe(403);
    expect(asPro.body.message).toContain("준비 중");

    expect((await send(free, freePersona, "안녕", "gpt-nothing")).status).toBe(400);

    // 막힌 시도는 대화를 만들지 않는다
    const history = await api<{ started: boolean }>(`/characters/${OFFICIAL_ID}/chat`, { token: free.token });
    expect(history.body.started).toBe(false);
  });

  test("대화 화면: 모델을 고르고 보내면 오늘 횟수가 바뀌고, 한도를 넘으면 안내가 나온다", async ({ browser }) => {
    const user = await signup("모델화면");
    await createPersona(user, "민준");
    const context = await browser.newContext();
    const page = await signedInPage(context, user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");

    const select = page.locator("#model-select");
    await expect(select).toHaveValue("basic");
    // 프리미엄은 눈에 보이지만 고를 수 없다
    const premium = select.locator('option[value="claude-opus-5-5"]');
    await expect(premium).toBeDisabled();
    await expect(premium).toHaveText(/프로 등급/);
    await expect(page.getByRole("link", { name: "프리미엄은 프로 등급" })).toHaveAttribute("href", "/pricing");
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
    await expect(page.getByText("답을 받지 못해 기록에 남지 않았어요")).toBeVisible();

    // 기본 모델로 바꾸면 이어서 말할 수 있다
    await select.selectOption("basic");
    await page.getByPlaceholder(/에게 말 걸기/).fill("모델 시험 넷");
    await page.getByRole("button", { name: "보내기" }).click();
    await expect(page.getByText(/가 답하는 중/)).toBeHidden();
    await expect(page.getByText("네, 알겠어요. 오늘도 천천히 이야기해 봐요.").last()).toBeVisible();

    // 새로고침해도 이 대화의 모델이 남는다
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#model-select")).toHaveValue("basic");
    await context.close();
  });
});
