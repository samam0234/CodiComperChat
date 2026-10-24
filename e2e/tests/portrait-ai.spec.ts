import { expect, test } from "@playwright/test";
import { api, passedDraft, signedInPage, signup, uniq } from "../helpers";

// 공방 외형 단계: AI로 초상 만들기 (25 코레딧). e2e는 가짜 그림 엔진·가짜 검수
const OPTIONS = {
  gender: "female",
  age: "30s",
  hairColor: "black",
  hairStyle: "ponytail",
  eyeColor: "purple",
  outfit: "suit",
  expression: "cold",
  background: "city",
};

type Draft = { hasPortrait: boolean; portraitReview: string | null };

test.describe("공방 · AI 초상 만들기", () => {
  test("25 코레딧으로 만들면 자동 검수를 거쳐 초상이 되고, 잘못된 값·코레딧 부족은 빼지 않는다", async () => {
    const owner = await signup("초상AI");
    const draftId = await passedDraft(owner, uniq("초상AI캐"));
    const gen = (json: unknown) =>
      api<{ draft: Draft; balance: number; cost: number; message?: string }>(`/studio/characters/${draftId}/portrait/generate`, {
        token: owner.token,
        json,
      });

    // 코레딧이 없으면 403, 초상은 그대로
    const poor = await gen({ style: "애니메이션", options: OPTIONS });
    expect(poor.status).toBe(403);
    await api("/me/attendance", { token: owner.token, method: "POST" });

    // 모르는 화풍·값은 400 (코레딧을 빼지 않는다)
    expect((await gen({ style: "유화", options: OPTIONS })).status).toBe(400);
    expect((await gen({ style: "웹툰", options: { ...OPTIONS, age: "10s" } })).status).toBe(400);
    expect((await gen({ style: "웹툰", options: OPTIONS, extra: "가".repeat(101) })).status).toBe(400);

    const made = await gen({ style: "웹툰", options: OPTIONS, extra: "얇은 안경" });
    expect(made.status).toBe(200);
    expect(made.body).toMatchObject({ cost: 25, balance: 975, draft: { hasPortrait: true, portraitReview: "APPROVED" } });
    const ledger = await api<{ history: { delta: number; modelId: string }[] }>("/me/credits", { token: owner.token });
    expect(ledger.body.history[0]).toMatchObject({ delta: -25, modelId: "op:portraitAi" });
    // 만든 초상을 만든 사람이 받을 수 있다
    const picture = await api(`/studio/characters/${draftId}/portrait`, { token: owner.token });
    expect(picture.status).toBe(200);
  });

  test("화면: 외형 단계 → AI로 직접 만들기 → 화풍·생김새 고르기 → 만들기 → 초상 미리보기", async ({ browser }) => {
    const owner = await signup("초상AI화면");
    await api("/me/attendance", { token: owner.token, method: "POST" });
    const draftId = await passedDraft(owner, uniq("초상화면캐"));
    const page = await signedInPage(await browser.newContext(), owner);
    await page.goto(`/studio/${draftId}`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /외형/ }).first().click();

    // 기존 버튼은 "내 파일 선택"
    await expect(page.getByText("내 파일 선택")).toBeVisible();
    await page.getByRole("button", { name: "AI로 직접 만들기 · 25 코레딧" }).click();
    const panel = page.getByRole("group", { name: "AI로 초상 만들기" });
    await panel.getByText("수채화").click();
    await panel.getByLabel("머리색").selectOption("silver");
    await panel.getByLabel("표정").selectOption("smile");
    await panel.getByRole("button", { name: "만들기 · 25 코레딧" }).click();
    await expect(panel.getByRole("status")).toContainText("초상을 만들었어요", { timeout: 60_000 });
    await expect(panel.getByRole("status")).toContainText("975");
    await expect(page.getByRole("img", { name: "올린 흉상 초상" })).toBeVisible();
  });
});
