import { expect, test } from "@playwright/test";
import { api, fullCard, setPlan, signedInPage, signup, uniq } from "../helpers";

const saveCard = (user: Awaited<ReturnType<typeof signup>>, id: string, mutate: (card: ReturnType<typeof fullCard>) => void) => {
  const card = fullCard(uniq("등급캐릭터"));
  mutate(card);
  return api(`/studio/characters/${id}`, { token: user.token, method: "PATCH", json: { card } });
};
const newDraft = async (user: Awaited<ReturnType<typeof signup>>) => (await api<{ id: string }>("/studio/characters", { token: user.token, method: "POST" })).body.id;

test.describe("요금 등급 (프로: 긴 글 칸 3배)", () => {
  test("무료는 400자까지, 이름 같은 짧은 칸은 프로여도 그대로다", async () => {
    const free = await signup("무료");
    const id = await newDraft(free);
    expect((await saveCard(free, id, (c) => (c.campaign.scene = "가".repeat(400)))).status).toBe(200);
    expect((await saveCard(free, id, (c) => (c.campaign.scene = "가".repeat(401)))).status).toBe(400);

    const pro = await signup("프로");
    await setPlan(pro, "PRO");
    const pid = await newDraft(pro);
    expect((await saveCard(pro, pid, (c) => (c.campaign.scene = "가".repeat(1200)))).status).toBe(200);
    expect((await saveCard(pro, pid, (c) => (c.campaign.scene = "가".repeat(1201)))).status).toBe(400);
    expect((await saveCard(pro, pid, (c) => (c.identity.oneLiner = "가".repeat(41)))).status).toBe(400);
  });

  test("화면: 무료는 프롬프트 연장 버튼(상자), 프로는 상한이 3배라는 표시", async ({ browser }) => {
    const free = await signup("화면무료");
    const pro = await signup("화면프로");
    await setPlan(pro, "PRO");

    const ctxFree = await browser.newContext();
    const pageFree = await signedInPage(ctxFree, free);
    await pageFree.goto(`/studio/${await newDraft(free)}`);
    await pageFree.getByLabel("공방 단계").getByRole("button", { name: /캠페인 역할/ }).click();
    await expect(pageFree.getByRole("textbox", { name: /^시작 장면/ })).toHaveAttribute("maxlength", "400");
    await expect(pageFree.getByRole("button", { name: "시작 장면 프롬프트 연장" })).toBeVisible();
    await expect(pageFree.getByText("프로 ×3")).toHaveCount(0);

    const ctxPro = await browser.newContext();
    const pagePro = await signedInPage(ctxPro, pro);
    await pagePro.goto(`/studio/${await newDraft(pro)}`);
    await pagePro.getByLabel("공방 단계").getByRole("button", { name: /캠페인 역할/ }).click();
    await expect(pagePro.getByRole("textbox", { name: /^시작 장면/ })).toHaveAttribute("maxlength", "1200");
    await expect(pagePro.getByRole("button", { name: /프롬프트 연장/ })).toHaveCount(0);
    await expect(pagePro.getByText("프로 ×3").first()).toBeVisible();
    // 이름은 프로여도 20자
    await pagePro.getByLabel("공방 단계").getByRole("button", { name: /정체성/ }).click();
    await expect(pagePro.getByRole("textbox", { name: /^이름/ })).toHaveAttribute("maxlength", "20");

    await pagePro.goto("/me");
    await expect(pagePro.getByText("프로 (공방 긴 글 칸 3배)")).toBeVisible();
    await Promise.all([ctxFree.close(), ctxPro.close()]);
  });

  test("프로 카드(긴 장면·첫 메시지)도 테스트 3턴을 거쳐 발행되고 대화가 된다", async () => {
    const pro = await signup("프로발행");
    await setPlan(pro, "PRO");
    const id = await newDraft(pro);
    const long = Array.from({ length: 40 }, (_, i) => `장면 ${i}의 설명이 이어집니다.`).join(" ");
    const name = uniq("프로캐릭터");
    const card = fullCard(name);
    card.campaign.scene = long;
    card.greeting.firstMessage = `${"빗소리가 창을 두드린다. ".repeat(40)}\n"어서 오세요."`;
    card.personality.summary = "다정하지만 속을 잘 드러내지 않는 사람이다. ".repeat(14);
    expect((await api(`/studio/characters/${id}`, { token: pro.token, method: "PATCH", json: { card } })).status).toBe(200);
    for (const message of ["안녕하세요", "비가 오네요", "고마워요"]) {
      expect((await api(`/studio/characters/${id}/test/chat`, { token: pro.token, json: { message } })).status).toBe(200);
    }
    const verdict = await api<{ passed: boolean; notes: string[] }>(`/studio/characters/${id}/test/critique`, { token: pro.token, method: "POST" });
    expect(verdict.body.passed, JSON.stringify(verdict.body)).toBe(true);
    await api(`/studio/characters/${id}/visibility`, { token: pro.token, method: "PATCH", json: { visibility: "PUBLIC" } });
    const published = await api<{ characterId: string }>(`/studio/characters/${id}/publish`, { token: pro.token, method: "POST" });
    expect(published.status).toBe(200);

    const reader = await signup("읽는이");
    const persona = (await api<{ id: string }>("/me/personas", { token: reader.token, json: { name: "손님", description: "" } })).body.id;
    const reply = await api<{ reply: string }>(`/characters/${published.body.characterId}/chat`, { token: reader.token, json: { message: "안녕하세요", personaId: persona } });
    expect(reply.status).toBe(200);
    expect(reply.body.reply).toContain("네, 알겠어요");
  });

  test("프로가 끝나도 긴 글은 그대로 보이고, 다른 칸은 저장되며, 긴 칸을 키우면 막힌다", async () => {
    const user = await signup("만료");
    await setPlan(user, "PRO");
    const id = await newDraft(user);
    expect((await saveCard(user, id, (c) => (c.campaign.scene = "가".repeat(900)))).status).toBe(200);

    await setPlan(user, "FREE");
    const view = await api<{ plan: string; limitMultiplier: number; card: { campaign: { scene: string } } }>(`/studio/characters/${id}`, { token: user.token });
    expect(view.body.plan).toBe("FREE");
    expect(view.body.limitMultiplier).toBe(1);
    expect(view.body.card.campaign.scene).toHaveLength(900);

    const keep = view.body.card;
    const edited = { ...keep, campaign: { ...keep.campaign, goal: "새 목표" } };
    expect((await api(`/studio/characters/${id}`, { token: user.token, method: "PATCH", json: { card: edited } })).status).toBe(200);
    const grown = { ...edited, campaign: { ...edited.campaign, scene: edited.campaign.scene + "나" } };
    expect((await api(`/studio/characters/${id}`, { token: user.token, method: "PATCH", json: { card: grown } })).status).toBe(400);
  });

  test("만료 시각이 지난 PRO는 무료로 본다", async () => {
    const user = await signup("기간");
    await setPlan(user, "PRO", new Date(Date.now() + 86_400_000));
    expect((await api<{ plan: string }>("/auth/me", { token: user.token })).body.plan).toBe("PRO");
    await setPlan(user, "PRO", new Date(Date.now() - 1000));
    expect((await api<{ plan: string }>("/auth/me", { token: user.token })).body.plan).toBe("FREE");
  });
});
