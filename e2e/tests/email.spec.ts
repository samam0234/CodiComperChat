import { expect, test } from "@playwright/test";
import { PASSWORD, api, latestMail, passedDraft, signedInPage, signup } from "../helpers";

test.describe("이메일 인증·비밀번호 찾기", () => {
  test("가입하면 인증 메일이 오고, 링크를 열어 버튼을 누르면 인증된다. 인증 전에는 발행할 수 없다", async ({ browser }) => {
    const user = await signup("인증", { verified: false });
    const me = await api<{ emailVerified: boolean }>("/auth/me", { token: user.token });
    expect(me.body.emailVerified).toBe(false);

    // 인증 전에는 캐릭터 발행이 막힌다
    const draftId = await passedDraft(user, `미인증캐릭터${Date.now() % 100000}`);
    const blocked = await api<{ message: string }>(`/studio/characters/${draftId}/publish`, { token: user.token, method: "POST" });
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toContain("이메일 인증");

    // 마이페이지에 미인증 안내가 보인다
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto("/me");
    await expect(page.getByText("(미인증)")).toBeVisible();
    await expect(page.getByRole("button", { name: "인증 메일 다시 받기" })).toBeVisible();

    // 메일의 링크를 연다. 링크만 열어서는 인증되지 않는다 (메일 검사기가 미리 열어도 안전하게)
    const mail = await latestMail(user.email, "이메일 주소를 확인");
    expect(mail.link).toContain("/verify-email?token=");
    await page.goto(mail.link);
    expect((await api<{ emailVerified: boolean }>("/auth/me", { token: user.token })).body.emailVerified).toBe(false);

    await page.getByRole("button", { name: "이메일 인증 완료하기" }).click();
    await expect(page.getByText("이메일 인증을 마쳤어요")).toBeVisible();
    expect((await api<{ emailVerified: boolean }>("/auth/me", { token: user.token })).body.emailVerified).toBe(true);

    // 같은 링크는 한 번만 쓴다
    const again = await api("/auth/verify-email", { json: { token: new URL(mail.link).searchParams.get("token") } });
    expect(again.status).toBe(400);

    // 이제 발행된다
    const published = await api(`/studio/characters/${draftId}/publish`, { token: user.token, method: "POST" });
    expect(published.status).toBe(200);
  });

  test("비밀번호 찾기 → 메일 링크 → 새 비밀번호. 그 뒤 옛 로그인은 끊기고 새 비밀번호로만 들어온다", async ({ page }) => {
    const user = await signup("재설정");

    await page.goto("/login");
    await page.getByRole("link", { name: "비밀번호를 잊었나요?" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await page.waitForLoadState("networkidle");
    await page.getByLabel("이메일").fill(user.email);
    await page.getByRole("button", { name: "재설정 링크 받기" }).click();
    await expect(page.getByText("가입된 이메일이라면")).toBeVisible();

    const mail = await latestMail(user.email, "비밀번호 재설정");
    await page.goto(mail.link);
    await page.waitForLoadState("networkidle");
    await page.locator("input[name=newPassword]").fill("brand-new-pass-77");
    await page.getByLabel("새 비밀번호 확인").fill("brand-new-pass-77");
    await page.getByRole("button", { name: "비밀번호 바꾸기" }).click();
    await expect(page).toHaveURL(/\/login\?reset=1/);
    await expect(page.getByText("새 비밀번호로 로그인해 주세요")).toBeVisible();

    // 재설정 전에 받은 토큰은 더는 통하지 않는다
    expect((await api("/auth/me", { token: user.token })).status).toBe(401);
    expect((await api("/auth/login", { json: { email: user.email, password: PASSWORD } })).status).toBe(401);
    expect((await api("/auth/login", { json: { email: user.email, password: "brand-new-pass-77" } })).status).toBe(200);

    // 같은 링크로 한 번 더 바꿀 수 없다
    const reuse = await api("/auth/password/reset", {
      json: { token: new URL(mail.link).searchParams.get("token"), newPassword: "another-pass-88" },
    });
    expect(reuse.status).toBe(400);
  });

  test("없는 이메일로 비밀번호 찾기를 해도 같은 응답이라 가입 여부가 드러나지 않는다", async () => {
    const res = await api("/auth/password/forgot", { json: { email: "nobody-here@e2e.test" } });
    expect(res.status).toBe(204);
  });

  test("비밀번호를 바꾸면 다른 기기의 로그인은 끊기고, 바꾼 기기는 새 토큰으로 이어 간다", async () => {
    const user = await signup("변경");
    const other = (await api<{ token: string }>("/auth/login", { json: { email: user.email, password: PASSWORD } })).body.token;
    const changed = await api<{ token: string }>("/auth/me/password", {
      token: user.token,
      json: { currentPassword: PASSWORD, newPassword: "changed-pass-99" },
    });
    expect(changed.status).toBe(200);
    expect((await api("/auth/me", { token: other })).status).toBe(401);
    expect((await api("/auth/me", { token: user.token })).status).toBe(401);
    expect((await api("/auth/me", { token: changed.body.token })).status).toBe(200);
  });
});
