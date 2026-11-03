import { expect, test } from "@playwright/test";
import { api, passedDraft, signedInPage, signup, uniq } from "../helpers";

test.describe("공방 · 추천 프로필", () => {
  test("입력해 발행하면 캐릭터에 실리고, 테스트를 무효로 만들지 않으며, 비우면 내려간다", async ({ browser }) => {
    const owner = await signup("추천공방");
    const draftId = await passedDraft(owner, uniq("추천공방캐"));
    const page = await signedInPage(await browser.newContext(), owner);
    await page.goto(`/studio/${draftId}`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /비밀 퀘스트/ }).first().click();

    await page.getByLabel("추천 프로필 이름", { exact: true }).fill("서도현");
    await page.getByLabel("추천 프로필 소개", { exact: true }).fill("대기업의 회장.");

    const card = async () => (await api<{ card: { recommendedPersona: { name: string; description: string } } }>(`/studio/characters/${draftId}`, { token: owner.token })).body.card;
    await expect.poll(async () => (await card()).recommendedPersona).toEqual({ name: "서도현", description: "대기업의 회장." });

    // 추천 프로필은 대화 품질 판정과 상관없어 테스트를 다시 받지 않아도 발행된다
    const published = await api<{ characterId: string }>(`/studio/characters/${draftId}/publish`, { token: owner.token, method: "POST" });
    expect(published.status).toBeLessThan(300);
    const character = await api<{ recommendedPersona: unknown }>(`/characters/${published.body.characterId}`, { token: owner.token });
    expect(character.body.recommendedPersona).toEqual({ name: "서도현", description: "대기업의 회장." });

    // 비우고 다시 발행하면 추천이 없어진다
    const current = await card();
    const cleared = await api(`/studio/characters/${draftId}`, {
      token: owner.token,
      method: "PATCH",
      json: { card: { ...(await api<{ card: object }>(`/studio/characters/${draftId}`, { token: owner.token })).body.card, recommendedPersona: { ...current.recommendedPersona, name: "" } } },
    });
    expect(cleared.status).toBe(200);
    expect((await api(`/studio/characters/${draftId}/publish`, { token: owner.token, method: "POST" })).status).toBeLessThan(300);
    const after = await api<{ recommendedPersona: unknown }>(`/characters/${published.body.characterId}`, { token: owner.token });
    expect(after.body.recommendedPersona).toBeNull();

    // 글자 수는 서버가 막는다
    const long = await api(`/studio/characters/${draftId}`, {
      token: owner.token,
      method: "PATCH",
      json: { card: { recommendedPersona: { name: "가".repeat(21) } } },
    });
    expect(long.status).toBe(400);
  });
});
