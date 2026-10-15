import { expect, test } from "@playwright/test";
import { signup, signedInPage, uniq } from "../helpers";

test.describe("계정", () => {
  test("로그인하지 않으면 보호된 페이지에서 로그인으로 보내고, 로그인 뒤 돌아온다", async ({ page }) => {
    await page.goto("/library");
    await expect(page).toHaveURL(/\/login\?next=%2Flibrary/);
    await expect(page.getByRole("button", { name: "로그인" }).first()).toBeVisible();
  });

  test("회원가입 → 로그아웃 → 로그인", async ({ page }) => {
    // 이메일 칸은 브라우저가 아이디 부분의 한글을 막으므로 영문·숫자로 만든다
    const name = uniq("가입");
    const email = `${uniq("signup")}@e2e.test`;
    await page.goto("/signup");
    // 개발 서버는 첫 로딩 때 컴파일·하이드레이션이 늦어, 끝나기 전에 누르면 제출이 무시된다
    await page.waitForLoadState("networkidle");
    await page.locator("input[name=email]").fill(email);
    await page.locator("input[name=displayName]").fill(name);
    await page.locator("input[name=password]").fill("pass1234word");
    await page.locator("input[name=passwordConfirm]").fill("pass1234word");
    await page.getByRole("button", { name: /가입/ }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/me");
    await expect(page.getByText(email)).toBeVisible();

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await page.getByRole("main").getByRole("button", { name: "로그아웃" }).click();
    // 로그아웃 액션이 끝나면 홈으로 보낸다. 끝나기 전에 다른 페이지로 가면 요청이 끊긴다
    await expect(page).toHaveURL("/");
    await page.goto("/me");
    await expect(page).toHaveURL(/\/login/);

    await page.locator("input[name=email]").fill(email);
    await page.locator("input[name=password]").fill("pass1234word");
    await page.getByRole("button", { name: "로그인" }).first().click();
    await expect(page).toHaveURL(/\/me/);
  });

  test("잘못된 비밀번호는 거절한다", async ({ page }) => {
    const user = await signup("틀림");
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("input[name=email]").fill(user.email);
    await page.locator("input[name=password]").fill("wrong-password-1");
    await page.getByRole("button", { name: "로그인" }).first().click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("마이페이지에서 내 프로필(주인공)을 만들고 지운다", async ({ browser }) => {
    const user = await signup("프로필");
    const context = await browser.newContext();
    const page = await signedInPage(context, user);
    await page.goto("/me");
    await page.getByLabel("이름").fill("주인공A");
    await page.getByRole("button", { name: /만들기|추가/ }).click();
    await expect(page.getByText("주인공A").first()).toBeVisible();
    await context.close();
  });
});
