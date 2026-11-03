import { expect, test } from "@playwright/test";
import { OFFICIAL_ID, api, chat, createPersona, signedInPage, signup } from "../helpers";

// ADULT_MODE=off 서버 전용 (npm run test:e2e:adult-off). 운영 compose의 기본값이다
test.describe("성인 모드를 끈 서버", () => {
  test("서버가 막고, 설정·코디포토넷·웹툰에 성인 입구가 없으며, 나이 확인은 그대로 쓴다", async ({ browser }) => {
    const user = await signup("성인끔", { verified: true });
    const persona = await createPersona(user);
    expect((await chat(user, OFFICIAL_ID, persona, "안녕하세요")).status).toBeLessThan(300);

    const me = await api<{ adultAvailable: boolean }>("/auth/me", { token: user.token });
    expect(me.body.adultAvailable).toBe(false);
    const confirm = await api("/auth/me/adult", { token: user.token, json: { birthDate: "1990-01-01", consent: true } });
    expect(confirm.status).toBe(403);

    const page = await signedInPage(await browser.newContext(), user);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("이 서비스는 지금 전체 이용가 콘텐츠만 제공합니다.")).toBeVisible();
    await expect(page.locator("#age-settings")).toBeVisible();

    const chatPath = `/characters/${OFFICIAL_ID}/chat`;
    await page.goto(chatPath);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "코디포토넷" }).click();
    const dialog = page.getByRole("dialog", { name: "코디포토넷" });
    await expect(dialog).toContainText("50 코레딧");
    await expect(dialog.getByRole("group", { name: "수위" })).toHaveCount(0);

    await page.goto(`${chatPath}/webtoon`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel("장면 설명")).toBeVisible();
    await expect(page.getByRole("group", { name: "수위" })).toHaveCount(0);
  });
});
