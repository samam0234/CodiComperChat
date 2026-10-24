import { expect, test } from "@playwright/test";
import { OFFICIAL_ID, api, chat, createPersona, fullCard, passedDraft, signedInPage, signup, sql, uniq, type User } from "../helpers";

// 비밀 퀘스트. 가짜 LLM이라 판정은 대사의 표시로 정한다: [부탁] = 캐릭터가 부탁을 건넸다, [해냄] = 유저가 달성 조건을 해냈다
const QUEST_ID = "e2e-quest";
const QUEST_CHAT = `/characters/${QUEST_ID}/chat`;

type Quest = { exists: boolean; started?: boolean; status?: string; title?: string; offer?: string; objective?: string; reward?: string | null; credits?: number; rewarded?: boolean };

const view = async (user: User, characterId = QUEST_ID) => (await api<Quest>(`/characters/${characterId}/chat/quest`, { token: user.token })).body;
const balance = async (user: User) => (await api<{ balance: number }>("/me/credits", { token: user.token })).body.balance;

// 이야기 정리는 뒤에서 돈다 — 상태가 바뀔 때까지 기다린다
async function until(user: User, status: string, characterId = QUEST_ID) {
  for (let i = 0; i < 40; i++) {
    if ((await view(user, characterId)).status === status) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`퀘스트가 ${status}가 되지 않았다: ${JSON.stringify(await view(user, characterId))}`);
}

// 정리는 대화가 3번 오갈 때(메시지 6개)마다 돈다
async function talk(user: User, characterId: string, personaId: string, first: string) {
  for (const message of [first, "그렇군요", "계속 이야기해 주세요"]) {
    expect((await chat(user, characterId, personaId, message)).status).toBe(200);
  }
}

async function closeTo(user: User, value: number, characterId = QUEST_ID) {
  expect((await api(`/characters/${characterId}/chat/state`, { token: user.token, method: "PATCH", json: { relationshipValue: value } })).status).toBe(200);
}

test.describe("비밀 퀘스트 · 진행", () => {
  test("건네기 전에는 제목도 내용도 보이지 않고, 친밀도가 문턱을 넘고 부탁이 오가면 열리며, 해내면 공식 캐릭터는 100 코레딧", async () => {
    const user = await signup("퀘스트");
    const personaId = await createPersona(user);
    await closeTo(user, 50);

    const locked = await view(user);
    expect(locked).toMatchObject({ exists: true, started: true, status: "locked", credits: 100 });
    // 건네기 전에는 퀘스트 내용이 응답에 없다
    expect(JSON.stringify(locked)).not.toContain("문제집");

    await talk(user, QUEST_ID, personaId, "[부탁] 무슨 일이세요?");
    await until(user, "offered");
    const offered = await view(user);
    expect(offered).toMatchObject({ status: "offered", title: "접어 둔 문제집" });
    expect(offered.offer).toContain("문제집");
    expect(offered.reward).toBeNull();

    const before = await balance(user);
    await talk(user, QUEST_ID, personaId, "[해냄] 같이 풀어 볼게요");
    await until(user, "done");
    const done = await view(user);
    expect(done).toMatchObject({ status: "done", rewarded: true });
    expect(done.reward).toContain("자기 얘기");
    expect(await balance(user)).toBe(before + 100);
    const ledger = await api<{ history: { reason: string; delta: number; modelId: string }[] }>("/me/credits", { token: user.token });
    expect(ledger.body.history.find((h) => h.reason === "QUEST")).toMatchObject({ delta: 100, modelId: `quest:${QUEST_ID}` });

    // 달성한 뒤에는 다시 판정하지 않는다
    await talk(user, QUEST_ID, personaId, "[해냄] 또 해냈어요");
    await new Promise((r) => setTimeout(r, 3000));
    expect(await balance(user)).toBe(before + 100);
  });

  test("친밀도가 문턱 아래면 부탁이 오가도 열리지 않는다", async () => {
    const user = await signup("퀘스트낮음");
    const personaId = await createPersona(user);
    await closeTo(user, 10);
    await talk(user, QUEST_ID, personaId, "[부탁] [해냄] 아직 서먹해요");
    await new Promise((r) => setTimeout(r, 3500));
    expect((await view(user)).status).toBe("locked");
  });

  test("같은 계정이 이 캐릭터의 보상을 이미 받았다면 또 주지 않는다", async () => {
    const user = await signup("퀘스트중복");
    const personaId = await createPersona(user);
    await sql(`insert into quest_rewards (id, "userId", "characterId", amount) select 'r' || id, id, $2, 100 from users where email = $1`, [user.email, QUEST_ID]);
    await closeTo(user, 60);
    await talk(user, QUEST_ID, personaId, "[부탁] [해냄] 같이 풀어요");
    await until(user, "done");
    expect(await balance(user)).toBe(0);
    expect((await view(user)).rewarded).toBe(true);
  });

  test("퀘스트가 없는 캐릭터는 exists false", async () => {
    const user = await signup("퀘스트없음");
    expect(await view(user, OFFICIAL_ID)).toEqual({ exists: false });
    expect((await api(`/characters/${QUEST_ID}/chat/quest`)).status).toBe(401);
  });
});

test.describe("비밀 퀘스트 · 공방(직접 쓰기·AI 자동 제작)", () => {
  const quest = { title: "빗속의 약속", offer: "비 오는 날 가게 문을 닫기 전에 같이 차를 마셔 달라고 부탁한다", objective: "유저가 남아서 함께 차를 마시겠다고 말한다", reward: "지우가 처음으로 가게 사정을 털어놓는다", unlockAt: 30 };

  test("덜 쓴 퀘스트는 안내가 나오고, AI가 한 번에 제안하며(저장 안 함), 발행하면 퀘스트가 붙는다", async () => {
    const owner = await signup("퀘스트제작");
    const name = uniq("퀘스트지우");
    const draftId = await passedDraft(owner, name);
    const patch = (q: unknown) => api<{ readiness: { steps: { key: string; missing: string[] }[] }; card: { quest: typeof quest } }>(`/studio/characters/${draftId}`, { token: owner.token, method: "PATCH", json: { card: { ...fullCard(name), quest: q } } });

    // 제목만 쓰면 부탁·달성 조건이 필요하다고 알려 준다 (선택 단계라 발행 준비에는 영향 없음)
    const partial = await patch({ ...quest, offer: "", objective: "" });
    expect(partial.body.readiness.steps.find((s) => s.key === "quest")?.missing).toEqual(["퀘스트 부탁", "퀘스트 달성 조건"]);

    // 문턱은 0~100 정수
    expect((await patch({ ...quest, unlockAt: 150 })).status).toBe(400);

    // AI 자동 제작: 제안만 돌려주고 카드는 바뀌지 않는다
    const proposed = await api<{ title: string; offer: string; objective: string; reward: string; unlockAt: number }>(`/studio/characters/${draftId}/draft-quest`, { token: owner.token, method: "POST" });
    expect(proposed.status).toBe(200);
    expect(proposed.body.title).not.toBe("");
    expect(proposed.body.offer).not.toBe("");
    expect(proposed.body.objective).not.toBe("");
    expect(proposed.body.unlockAt).toBeGreaterThanOrEqual(10);
    const saved = await api<{ card: { quest: { title: string } } }>(`/studio/characters/${draftId}`, { token: owner.token });
    expect(saved.body.card.quest.title).toBe("빗속의 약속");

    // 칸별 AI 초안도 된다
    const field = await api<{ value: string }>(`/studio/characters/${draftId}/draft-field`, { token: owner.token, json: { field: "quest.objective" } });
    expect(field.status).toBe(200);
    expect(field.body.value).not.toBe("");

    // 직접 쓴 퀘스트로 발행 → 다른 사람이 보면 "있다"만, 내용은 건네기 전까지 숨김
    expect((await patch(quest)).status).toBe(200);
    await api(`/studio/characters/${draftId}/visibility`, { token: owner.token, method: "PATCH", json: { visibility: "PUBLIC" } });
    const published = await api<{ characterId: string }>(`/studio/characters/${draftId}/publish`, { token: owner.token, method: "POST" });
    expect(published.body, JSON.stringify(published)).toHaveProperty("characterId");
    const characterId = published.body.characterId;
    const other = await signup("퀘스트손님");
    const seen = await api<Quest>(`/characters/${characterId}/chat/quest`, { token: other.token });
    expect(seen.body).toMatchObject({ exists: true, status: "locked", credits: 0 });
    expect(JSON.stringify(seen.body)).not.toContain("차를 마시");
    // 공개 캐릭터 응답에는 퀘스트가 없다
    const open = await api<Record<string, unknown>>(`/characters/${characterId}`, { token: other.token });
    expect(open.body).not.toHaveProperty("quest");
    expect(JSON.stringify(open.body)).not.toContain("차를 마시");
  });

  test("유저가 만든 캐릭터의 퀘스트는 달성해도 코레딧이 없다 (보상 장면만)", async () => {
    const owner = await signup("퀘스트제작2");
    const name = uniq("퀘스트민서");
    const draftId = await passedDraft(owner, name);
    await api(`/studio/characters/${draftId}`, { token: owner.token, method: "PATCH", json: { card: { ...fullCard(name), quest } } });
    await api(`/studio/characters/${draftId}/visibility`, { token: owner.token, method: "PATCH", json: { visibility: "PUBLIC" } });
    const { body } = await api<{ characterId: string }>(`/studio/characters/${draftId}/publish`, { token: owner.token, method: "POST" });

    const player = await signup("퀘스트플레이어");
    const personaId = await createPersona(player);
    await closeTo(player, 50, body.characterId);
    await talk(player, body.characterId, personaId, "[부탁] 오늘은 비가 오네요");
    await until(player, "offered", body.characterId);
    await talk(player, body.characterId, personaId, "[해냄] 남아서 같이 마실게요");
    await until(player, "done", body.characterId);
    const done = await view(player, body.characterId);
    expect(done.reward).toContain("가게 사정");
    expect(await balance(player)).toBe(0);
  });
});

test.describe("비밀 퀘스트 · 화면", () => {
  test("퀘스트가 있는 캐릭터에만 버튼이 있고, 잠겨 있으면 ???만 보인다", async ({ browser }) => {
    const user = await signup("퀘스트화면");
    const personaId = await createPersona(user);
    expect((await chat(user, QUEST_ID, personaId, "안녕하세요")).status).toBe(200);
    const page = await signedInPage(await browser.newContext(), user);

    await page.goto(QUEST_CHAT);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "비밀 퀘스트" }).click();
    const dialog = page.getByRole("dialog", { name: "비밀 퀘스트" });
    await expect(dialog.getByText("???")).toBeVisible();
    await expect(dialog).toContainText("100 코레딧");
    await expect(dialog).not.toContainText("접어 둔 문제집");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // 퀘스트 없는 캐릭터에는 버튼이 없다
    await page.goto(`/characters/${OFFICIAL_ID}/chat`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "코디포토넷" })).toBeVisible();
    await expect(page.getByRole("button", { name: "비밀 퀘스트" })).toHaveCount(0);
  });

  test("건넨 뒤에는 제목·부탁·이루는 법이 보이고, 해내면 달성과 보상이 보인다", async ({ browser }) => {
    const user = await signup("퀘스트화면2");
    const personaId = await createPersona(user);
    await closeTo(user, 50);
    await talk(user, QUEST_ID, personaId, "[부탁] 말씀하세요");
    await until(user, "offered");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(QUEST_CHAT);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "비밀 퀘스트" }).click();
    const dialog = page.getByRole("dialog", { name: "비밀 퀘스트" });
    await expect(dialog.locator("strong", { hasText: "접어 둔 문제집" })).toBeVisible();
    await expect(dialog.getByText("진행 중")).toBeVisible();
    await expect(dialog).toContainText("문제집을 같이 풀어 봐 달라고");
    await page.keyboard.press("Escape");

    await talk(user, QUEST_ID, personaId, "[해냄] 같이 풀어요");
    await until(user, "done");
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "비밀 퀘스트" }).click();
    await expect(dialog.getByText("달성", { exact: true })).toBeVisible();
    await expect(dialog).toContainText("처음으로 자기 얘기를 한다");
    await expect(dialog).toContainText("100 코레딧을 받았어요");
  });

  test("공방: 비밀 퀘스트 단계에서 AI로 만들고 적용하면 칸이 채워지고, 직접 고칠 수 있다", async ({ browser }) => {
    const owner = await signup("퀘스트공방");
    const draftId = await passedDraft(owner, uniq("퀘스트공방캐"));
    const page = await signedInPage(await browser.newContext(), owner);
    await page.goto(`/studio/${draftId}`);
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /비밀 퀘스트/ }).first().click();
    const title = page.getByLabel("퀘스트 이름", { exact: true });
    await expect(title).toHaveValue("");
    await page.getByRole("button", { name: "AI로 퀘스트 만들기" }).click();
    const panel = page.getByRole("group", { name: "AI 퀘스트 제안" });
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "적용하기" }).click();
    await expect(page.getByLabel("퀘스트 이름", { exact: true })).not.toHaveValue("");
    await expect(page.getByLabel("퀘스트 부탁", { exact: true })).not.toHaveValue("");
    await expect(page.getByLabel("퀘스트 달성 조건", { exact: true })).not.toHaveValue("");

    // 직접 고쳐 쓰고 지울 수 있다
    await page.getByLabel("퀘스트 이름", { exact: true }).fill("나만의 퀘스트");
    await expect(page.getByLabel("퀘스트 이름", { exact: true })).toHaveValue("나만의 퀘스트");
    await page.getByRole("button", { name: "퀘스트 지우기" }).click();
    await expect(page.getByLabel("퀘스트 이름", { exact: true })).toHaveValue("");
  });
});
