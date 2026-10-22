import { expect, test } from "@playwright/test";
import { createPersona, setPlan, signedInPage, signup } from "../helpers";

test.describe("마이페이지·설정", () => {
  test("마이페이지: 프로필 머리말·바로가기·요금 등급 카드·프로필 캐릭터 카드", async ({ browser }) => {
    const user = await signup("마이무료");
    await createPersona(user, "민준");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto("/me");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(user.name + "");
    await expect(page.getByRole("list", { name: "계정 정보" })).toContainText("무료");

    const shortcuts = page.getByRole("navigation", { name: "바로가기" });
    await expect(shortcuts.getByRole("link", { name: /대화 목록/ })).toHaveAttribute("href", "/library");
    await expect(shortcuts.getByRole("link", { name: /캐릭터 공방/ })).toHaveAttribute("href", "/studio");
    await expect(shortcuts.getByRole("link", { name: /요금 안내/ })).toHaveAttribute("href", "/pricing");

    const plan = page.getByRole("region", { name: "요금 등급" });
    await expect(plan).toContainText("강화 무료 모델 하루 30번");
    await expect(plan.getByRole("link", { name: "프로 알아보기" })).toBeVisible();

    // 프로 등급이면 혜택이 바뀐다
    await setPlan(user, "PRO");
    await page.reload();
    await expect(page.getByRole("region", { name: "요금 등급" })).toContainText("강화 무료 모델(gemma4:12b) 무제한");

    // 가운데 정렬: 머리말 카드가 화면 가운데에 온다 (왼쪽으로 치우치지 않는다)
    const box = await page.locator("header").filter({ hasText: "마이페이지" }).boundingBox();
    const viewport = page.viewportSize()!;
    expect(Math.abs(box!.x + box!.width / 2 - viewport.width / 2)).toBeLessThan(24);

    const personas = page.getByRole("region", { name: /내 프로필 캐릭터/ });
    await expect(personas.getByText("민준")).toBeVisible();
    await expect(personas.getByRole("heading", { name: "새로 만들기" })).toBeVisible();
  });

  test("설정: 목차 링크, 테마 카드를 골라 저장하면 화면이 바뀐다", async ({ browser }) => {
    const user = await signup("설정점검");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    const menu = page.getByRole("navigation", { name: "설정 목차" });
    for (const [label, id] of [["화면", "display-settings"], ["계정", "profile-settings"], ["비밀번호", "password-settings"], ["회원 탈퇴", "delete-settings"]]) {
      await expect(menu.getByRole("link", { name: label })).toHaveAttribute("href", `#${id}`);
    }

    // 카드를 눌러 다크 모드 영구 → 저장 → 새로고침해도 유지
    await page.locator("label", { has: page.getByRole("radio", { name: /^다크 모드 영구 설정/ }) }).click();
    await page.getByRole("region", { name: "화면" }).getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("화면 테마를 저장했습니다.")).toBeVisible();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("radio", { name: /^다크 모드 영구 설정/ })).toBeChecked();

    // 이메일 인증 상태와 정책 링크
    await expect(page.getByRole("region", { name: "계정" })).toContainText("이메일 인증");
    const help = page.getByRole("region", { name: "정책 · 도움말" });
    await expect(help.getByRole("link", { name: "이용약관" })).toHaveAttribute("href", "/terms");
    await expect(help.getByRole("link", { name: "고객센터" })).toHaveAttribute("href", "/support");
  });

  test("로그인하지 않아도 설정에서 화면 테마는 바꿀 수 있고, 계정 설정은 로그인 안내가 나온다", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("region", { name: "화면" })).toBeVisible();
    await expect(page.getByText("로그인하면 표시 이름, 비밀번호 같은 계정 설정이")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "설정 목차" }).getByRole("link", { name: "회원 탈퇴" })).toHaveCount(0);
  });
});
