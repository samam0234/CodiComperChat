import { expect, test } from "@playwright/test";
import { PASSWORD, api, publishedCharacter, signedInPage, signup, sql, uniq } from "../helpers";

test.describe("회원 탈퇴", () => {
  test("비밀번호와 확인 문구로 탈퇴하면 계정·데이터가 지워지고, 발행한 캐릭터는 내려가며(공식으로 보이지 않게) 결제 기록은 남는다", async ({ browser }) => {
    const user = await signup("탈퇴");
    const name = uniq("탈퇴캐릭터");
    const { characterId } = await publishedCharacter(user, name, "PUBLIC");
    const checkout = await api<{ orderId: string; amount: number }>("/billing/checkout", { token: user.token, json: { productId: "pro-30" } });
    await api("/billing/confirm", {
      token: user.token,
      json: { orderId: checkout.body.orderId, paymentKey: `mock_${checkout.body.orderId}`, amount: checkout.body.amount },
    });

    // 비밀번호가 틀리거나 확인 문구가 없으면 지우지 않는다
    expect((await api("/auth/me", { token: user.token, method: "DELETE", json: { password: "wrong-pass-1", confirm: "탈퇴합니다" } })).status).toBe(401);
    expect((await api("/auth/me", { token: user.token, method: "DELETE", json: { password: PASSWORD, confirm: "" } })).status).toBe(400);

    const page = await signedInPage(await browser.newContext(), user);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    const section = page.getByRole("region", { name: "회원 탈퇴" });
    await section.getByLabel("비밀번호").fill(PASSWORD);
    await section.getByLabel("확인 문구").fill("탈퇴합니다");
    await section.getByRole("button", { name: "회원 탈퇴" }).click();
    await expect(page).toHaveURL(/\/\?bye=1$/);
    await expect(page.getByText("탈퇴가 끝났어요")).toBeVisible();

    // 로그인도, 예전 토큰도 안 된다
    expect((await api("/auth/login", { json: { email: user.email, password: PASSWORD } })).status).toBe(401);
    expect((await api("/auth/me", { token: user.token })).status).toBe(401);

    // 발행한 캐릭터는 목록·상세에서 사라진다 (주인 없는 캐릭터가 "공식"으로 남지 않게)
    expect((await api(`/characters/${characterId}`)).status).toBe(404);
    const list = await api<{ id: string }[]>("/characters");
    expect(list.body.some((c) => c.id === characterId)).toBe(false);

    // 결제 기록은 계정 연결만 끊기고 남는다
    const [order] = await sql<{ userId: string | null; buyerEmail: string; status: string }>(
      'SELECT "userId", "buyerEmail", status FROM payment_orders WHERE id = $1',
      [checkout.body.orderId],
    );
    expect(order).toMatchObject({ userId: null, buyerEmail: user.email, status: "PAID" });
    expect(await sql("SELECT 1 FROM users WHERE email = $1", [user.email])).toHaveLength(0);
  });
});
