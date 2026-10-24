import { expect, test } from "@playwright/test";
import { api, signedInPage, signup } from "../helpers";

// 캐릭터별 추천 프로필 (선택): 그대로 쓰거나 고쳐서 내 프로필로 만들고 바로 고른다
const CHAT = "/characters/e2e-rec/chat";

test.describe("추천 프로필", () => {
  test("프로필이 하나도 없으면 추천 프로필로 바로 시작할 수 있고, 첫 장면은 나레이션으로 시작한다", async ({ browser }) => {
    const user = await signup("추천프로필");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");

    const card = page.getByRole("region", { name: "추천 프로필" });
    await expect(card).toContainText("서도현");
    await card.getByRole("button", { name: "이 프로필로 시작" }).click();

    await expect(page.locator("#persona-select")).toHaveValue(/.+/);
    await expect(page.locator("#persona-select option:checked")).toHaveText("서도현");
    // 시작 장면의 나레이션(@:)이 나레이션으로 그려진다
    await expect(page.getByRole("log").getByText("회장실. 비서가 서류를 들고 들어온다.")).toBeVisible();
    await page.getByPlaceholder(/에게 말 걸기/).fill("보고서 고마워요");
    await page.getByRole("button", { name: "보내기" }).click();
    await expect(page.getByText(/가 답하는 중/)).toBeHidden();

    const personas = await api<{ name: string; description: string }[]>("/me/personas", { token: user.token });
    expect(personas.body.map((p) => p.name)).toEqual(["서도현"]);
  });

  test("고쳐서 쓰면 바꾼 이름·소개로 만들어지고, 같은 이름이 이미 있으면 새로 만들지 않는다", async ({ browser }) => {
    const user = await signup("추천고쳐");
    await api("/me/personas", { token: user.token, json: { name: "민준", description: "시험용" } });
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");

    const card = page.getByRole("region", { name: "추천 프로필" });
    await card.getByRole("button", { name: "고쳐서 쓰기" }).click();
    await card.getByLabel("이름").fill("한지후");
    await card.getByLabel("소개").fill("스타트업 출신의 젊은 회장");
    await card.getByRole("button", { name: "이대로 만들고 쓰기" }).click();
    await expect(page.locator("#persona-select option:checked")).toHaveText("한지후");
    // 프로필을 고르면 추천 카드는 사라진다
    await expect(card).toBeHidden();

    const personas = await api<{ name: string; description: string }[]>("/me/personas", { token: user.token });
    expect(personas.body.find((p) => p.name === "한지후")?.description).toBe("스타트업 출신의 젊은 회장");
    expect(personas.body).toHaveLength(2);
  });

  test("캐릭터 응답에 추천 프로필이 실리고, 없는 캐릭터는 null", async () => {
    const withRec = await api<{ recommendedPersona: { name: string } | null }>("/characters/e2e-rec");
    expect(withRec.body.recommendedPersona?.name).toBe("서도현");
    const without = await api<{ recommendedPersona: unknown }>("/characters/e2e-official");
    expect(without.body.recommendedPersona).toBeNull();
  });
});
