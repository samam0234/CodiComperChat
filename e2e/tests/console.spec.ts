import { expect, test } from "@playwright/test";
import { URLS } from "../env.mjs";
import { PASSWORD, api, consolePage, makeAdmin, publishedCharacter, signedInPage, signup, uniq } from "../helpers";

const C = URLS.console;

test.describe("운영 콘솔", () => {
  test("운영자만 로그인된다: 일반 계정은 거절, 운영자는 대시보드로", async ({ page }) => {
    const user = await signup("콘솔일반");
    const admin = await signup("콘솔운영");
    await makeAdmin(admin);

    // 로그인하지 않으면 어느 화면이든 로그인으로
    await page.goto(`${C}/characters`);
    await expect(page).toHaveURL(/\/login\?next=%2Fcharacters/);
    await page.waitForLoadState("networkidle");

    await page.getByLabel("이메일").fill(user.email);
    await page.getByLabel("비밀번호").fill(PASSWORD);
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.getByText("운영자 계정이 아닙니다")).toBeVisible();

    await page.getByLabel("이메일").fill(admin.email);
    await page.getByLabel("비밀번호").fill(PASSWORD);
    await page.getByRole("button", { name: "로그인" }).click();
    // 원래 가려던 곳(캐릭터)으로 돌아간다
    await expect(page).toHaveURL(`${C}/characters`);
    await expect(page.getByRole("navigation", { name: "콘솔 메뉴" })).toBeVisible();

    // 이용자 사이트의 로그인 쿠키와는 따로다
    const cookies = await page.context().cookies(C);
    expect(cookies.find((c) => c.name === "console_session")?.sameSite).toBe("Strict");
    expect(cookies.some((c) => c.name === "session")).toBe(false);

    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("대시보드에 처리할 일·이용자·캐릭터·AI 대기열 숫자가 보이고, 일반 계정은 통계 API를 못 쓴다", async ({ browser }) => {
    const admin = await signup("대시보드");
    await makeAdmin(admin);
    const reporter = await signup("대시신고");
    const { characterId } = await publishedCharacter(await signup("대시주인"), uniq("대시캐릭터"), "PUBLIC");
    await api(`/characters/${characterId}/report`, { token: reporter.token, json: { reason: "SPAM" } });

    expect((await api("/admin/stats", { token: reporter.token })).status).toBe(403);
    const stats = await api<{ moderation: { openReports: number }; users: { total: number }; ai: { concurrency: number } }>("/admin/stats", { token: admin.token });
    expect(stats.status).toBe(200);
    expect(stats.body.moderation.openReports).toBeGreaterThanOrEqual(1);
    expect(stats.body.ai.concurrency).toBeGreaterThanOrEqual(1);

    const page = await consolePage(await browser.newContext(), admin);
    await page.goto(C);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "대시보드", level: 1 })).toBeVisible();
    const todo = page.getByRole("region", { name: "할 일" });
    await expect(todo.getByRole("link", { name: /열린 신고/ })).toBeVisible();
    await expect(page.getByRole("region", { name: "AI 대기열" })).toContainText("처리 중");
    await todo.getByRole("link", { name: /열린 신고/ }).click();
    await expect(page).toHaveURL(`${C}/reports`);
  });

  test("캐릭터 목록에서 찾고, 신고가 없어도 바로 내리고 복구한다 (비공개 캐릭터도 보인다)", async ({ browser }) => {
    const admin = await signup("캐릭관리");
    await makeAdmin(admin);
    const owner = await signup("캐릭주인");
    const name = uniq("숨김확인");
    const { characterId } = await publishedCharacter(owner, name, "PRIVATE");

    const page = await consolePage(await browser.newContext(), admin);
    // "전체"에서 본다 (비공개 필터는 내려간 캐릭터를 빼고 보여 준다)
    await page.goto(`${C}/characters`);
    await page.waitForLoadState("networkidle");
    await page.getByLabel("캐릭터 찾기").fill(name);
    await page.getByRole("button", { name: "찾기" }).click();
    const row = page.getByRole("row", { name });
    await expect(row).toContainText("비공개");
    await expect(row).toContainText(owner.email);

    await row.getByRole("button", { name: "내리기" }).click();
    const dialog = page.getByRole("dialog", { name: /내릴까요/ });
    await dialog.locator("textarea").fill("운영 정책 위반");
    await dialog.getByRole("button", { name: "내리기" }).click();
    await expect(row).toContainText("내려감");
    await expect(row).toContainText("운영 정책 위반");
    expect((await api(`/characters/${characterId}`, { token: owner.token })).status).toBe(404);

    await row.getByRole("button", { name: "복구" }).click();
    // 복구가 끝나면 다시 "내리기" 버튼이 생긴다
    await expect(row.getByRole("button", { name: "내리기" })).toBeVisible();
    await expect(row).toContainText("비공개");
    expect((await api(`/characters/${characterId}`, { token: owner.token })).status).toBe(200);

    // 일반 계정은 캐릭터 전체 목록을 못 본다
    expect((await api("/admin/characters", { token: owner.token })).status).toBe(403);
  });

  test("이용자 사이트: 운영자에게만 콘솔 링크가 보이고, 예전 /admin 주소는 콘솔로 보낸다", async ({ browser }) => {
    const admin = await signup("링크운영");
    await makeAdmin(admin);
    const user = await signup("링크일반");

    const adminPage = await signedInPage(await browser.newContext(), admin);
    await adminPage.goto("/me");
    await expect(adminPage.getByRole("link", { name: "운영 콘솔 열기" })).toHaveAttribute("href", /3001|3102/);

    const userPage = await signedInPage(await browser.newContext(), user);
    await userPage.goto("/me");
    await expect(userPage.getByRole("link", { name: "운영 콘솔 열기" })).toHaveCount(0);

    const res = await adminPage.request.get("/admin/reports", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toMatch(/\/reports$/);
  });

  test("콘솔 화면에 엄격한 CSP와 검색 엔진 차단 헤더가 붙는다", async ({ request }) => {
    const res = await request.get(`${C}/login`);
    const policy = res.headers()["content-security-policy"];
    expect(policy).toMatch(/'nonce-[^']+'/);
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).not.toContain("tosspayments");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
  });
});
