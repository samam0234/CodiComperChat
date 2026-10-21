import { expect, test, type Page } from "@playwright/test";
import { URLS } from "../env.mjs";
import { signedInPage, signup } from "../helpers";

// 한국 시각 → 브라우저 시계. 첫 화면은 서버(실제 시각)가 그리고, 화면이 뜨면 브라우저 시계로 다시 맞춘다
const kst = (hhmmss: string) => new Date(`2026-10-22T${hhmmss}+09:00`);
const shade = (page: Page) => page.locator("html");
const button = (page: Page) => page.getByRole("banner").getByRole("button", { name: /모드로 바꾸기/ });

test.describe("테마 (밝기 버튼·시간표)", () => {
  test("자동: 낮(오전 7시~오후 10시)은 밝게, 헤더 버튼으로 다음 전환까지 바꿀 수 있다", async ({ page }) => {
    await page.clock.install({ time: kst("12:00:00") });
    await page.goto("/");
    await expect(shade(page)).toHaveAttribute("data-theme", "light");
    await expect(button(page)).toHaveAccessibleName("다크 모드로 바꾸기");

    await button(page).click();
    await expect(shade(page)).toHaveAttribute("data-theme", "dark");
    await expect(button(page)).toHaveAccessibleName("밝기 모드로 바꾸기");

    // 잠깐 바꾼 것은 오후 10시(다음 전환)까지 쿠키에 남는다
    await expect
      .poll(async () => (await page.context().cookies(URLS.web)).find((c) => c.name === "theme_override")?.value)
      .toBe(`dark.${kst("22:00:00").getTime()}`);
    await page.reload();
    await expect(shade(page)).toHaveAttribute("data-theme", "dark");
  });

  test("자동: 밤(오후 10시~오전 7시)은 어둡게", async ({ page }) => {
    await page.clock.install({ time: kst("23:30:00") });
    await page.goto("/");
    await expect(shade(page)).toHaveAttribute("data-theme", "dark");
    await expect(button(page)).toHaveAccessibleName("밝기 모드로 바꾸기");
  });

  test("자동: 화면을 열어 둔 채 오후 10시가 지나면 저절로 어두워지고, 오전 7시가 지나면 밝아진다", async ({ page }) => {
    await page.clock.install({ time: kst("21:59:50") });
    await page.goto("/");
    await expect(shade(page)).toHaveAttribute("data-theme", "light");
    await page.clock.fastForward("00:20");
    await expect(shade(page)).toHaveAttribute("data-theme", "dark");
    // 다음 날 오전 7시까지 9시간
    await page.clock.fastForward("09:00:00");
    await expect(shade(page)).toHaveAttribute("data-theme", "light");
  });

  test("설정에서 영구 설정하면 시간과 상관없이 유지되고, 헤더 버튼은 영구 설정을 반대쪽으로 바꾼다", async ({ browser }) => {
    const user = await signup("테마영구");
    const context = await browser.newContext();
    const page = await signedInPage(context, user);
    await page.clock.install({ time: kst("23:00:00") });
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(shade(page)).toHaveAttribute("data-theme", "dark");

    await page.locator("label", { has: page.getByRole("radio", { name: /^밝기 모드 영구 설정/ }) }).click();
    await page.getByRole("region", { name: "화면" }).getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("화면 테마를 저장했습니다.")).toBeVisible();
    await page.reload();
    // 밤이어도 밝게
    await expect(shade(page)).toHaveAttribute("data-theme", "light");
    await expect(page.getByRole("radio", { name: /^밝기 모드 영구 설정/ })).toBeChecked();

    // 오전 7시·오후 10시를 지나도 그대로
    await page.clock.fastForward("09:00:00");
    await expect(shade(page)).toHaveAttribute("data-theme", "light");

    // 헤더 버튼: 영구 설정이 다크 영구로 바뀐다
    await button(page).click();
    await expect(shade(page)).toHaveAttribute("data-theme", "dark");
    // 저장(서버 액션)이 끝난 뒤에 새로고침한다
    await expect.poll(async () => (await context.cookies(URLS.web)).find((c) => c.name === "theme")?.value).toBe("dark");
    await page.reload();
    await expect(page.getByRole("radio", { name: /^다크 모드 영구 설정/ })).toBeChecked();
    await expect(shade(page)).toHaveAttribute("data-theme", "dark");
    await context.close();
  });

  test("설정에서 다시 자동으로 두면 헤더에서 잠깐 바꾼 것도 지워진다", async ({ page }) => {
    await page.clock.install({ time: kst("12:00:00") });
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await button(page).click();
    await expect(shade(page)).toHaveAttribute("data-theme", "dark");

    await page.locator("label", { has: page.getByRole("radio", { name: /^시간에 따라 자동/ }) }).click();
    await page.getByRole("region", { name: "화면" }).getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("화면 테마를 저장했습니다.")).toBeVisible();
    await page.reload();
    await expect(shade(page)).toHaveAttribute("data-theme", "light");
    expect((await page.context().cookies(URLS.web)).some((c) => c.name === "theme_override")).toBe(false);
  });
});
