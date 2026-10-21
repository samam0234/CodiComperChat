import { expect, test } from "@playwright/test";
import { URLS } from "../env.mjs";
import { api, consolePage, makeAdmin, signedInPage, signup, sql } from "../helpers";

// e2e는 가짜 결제(BILLING_PROVIDER=mock)로 돈 없이 결제 흐름 전체를 시험한다. 토스 승인 요청 모양은 apps/api 단위 테스트가 본다
test.describe("결제", () => {
  test("요금 안내 → 시험 결제 → 승인되면 프로가 되고, 공방 상한·마이페이지·결제 내역이 바뀐다", async ({ browser }) => {
    const user = await signup("결제");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("시험 모드")).toBeVisible();
    // 동의하기 전에는 결제창이 열리지 않는다
    await page.getByRole("button", { name: "프로 30일 결제" }).click();
    await expect(page.getByText("주문·환불 안내를 확인하고 동의해 주세요")).toBeVisible();
    await expect(page.getByRole("region", { name: "환불 안내" })).toContainText("7일 이내");
    await page.getByLabel("주문 내용(상품·기간·금액)과 환불 기준을 확인했고 결제에 동의합니다").check();
    await page.getByRole("button", { name: "프로 30일 결제" }).click();

    await expect(page).toHaveURL(/\/billing\/mock\?/);
    await page.getByRole("link", { name: "시험 결제 승인" }).click();
    await expect(page).toHaveURL(/\/billing\/success\?/);
    await expect(page.getByText("결제가 끝났어요")).toBeVisible();

    const me = await api<{ plan: string }>("/auth/me", { token: user.token });
    expect(me.body.plan).toBe("PRO");
    const orders = await api<{ orders: { amount: number; days: number }[]; planUntil: string }>("/billing/orders", { token: user.token });
    expect(orders.body.orders).toHaveLength(1);
    expect(orders.body.orders[0]).toMatchObject({ amount: 4900, days: 30 });
    const left = new Date(orders.body.planUntil).getTime() - Date.now();
    expect(left).toBeGreaterThan(29 * 86_400_000);
    expect(left).toBeLessThan(31 * 86_400_000);

    // 같은 결제 화면을 새로고침해도 두 번 늘지 않는다
    await page.reload();
    await expect(page.getByText("결제가 끝났어요")).toBeVisible();
    const again = await api<{ planUntil: string }>("/billing/orders", { token: user.token });
    expect(again.body.planUntil).toBe(orders.body.planUntil);

    await page.goto("/me");
    await expect(page.getByRole("region", { name: "결제 내역" })).toContainText("프로 30일");
    await expect(page.getByRole("link", { name: "기간 늘리기" })).toBeVisible();
  });

  test("남은 프로 기간이 있으면 결제한 기간이 그 뒤에 붙는다", async () => {
    const user = await signup("연장");
    const pay = async () => {
      const checkout = await api<{ orderId: string; amount: number }>("/billing/checkout", { token: user.token, json: { productId: "pro-30" } });
      return api<{ planUntil: string }>("/billing/confirm", {
        token: user.token,
        json: { orderId: checkout.body.orderId, paymentKey: `mock_${checkout.body.orderId}`, amount: checkout.body.amount },
      });
    };
    const first = new Date((await pay()).body.planUntil).getTime();
    const second = new Date((await pay()).body.planUntil).getTime();
    expect(Math.round((second - first) / 86_400_000)).toBe(30);
  });

  test("금액을 바꾸거나, 남의 주문이거나, 없는 상품이면 승인되지 않는다", async () => {
    const user = await signup("변조");
    const other = await signup("남주문");
    expect((await api("/billing/checkout", { token: user.token, json: { productId: "free-money" } })).status).toBe(400);

    const checkout = await api<{ orderId: string; amount: number }>("/billing/checkout", { token: user.token, json: { productId: "pro-30" } });
    const { orderId } = checkout.body;
    // 남이 내 주문을 승인할 수 없다
    expect((await api("/billing/confirm", { token: other.token, json: { orderId, paymentKey: `mock_${orderId}`, amount: 4900 } })).status).toBe(404);
    // 금액을 바꾸면 거절되고 그 주문은 실패로 끝난다
    expect((await api("/billing/confirm", { token: user.token, json: { orderId, paymentKey: `mock_${orderId}`, amount: 100 } })).status).toBe(400);
    expect((await api("/billing/confirm", { token: user.token, json: { orderId, paymentKey: `mock_${orderId}`, amount: 4900 } })).status).toBe(409);
    const [order] = await sql<{ status: string }>('SELECT status FROM payment_orders WHERE id = $1', [orderId]);
    expect(order.status).toBe("FAILED");
    expect((await api<{ plan: string }>("/auth/me", { token: user.token })).body.plan).toBe("FREE");
  });

  test("운영자는 계정 등급 화면에서 이메일로 찾아 프로·무료로 바꾼다. 일반 유저는 못 한다", async ({ browser }) => {
    const admin = await signup("등급운영자");
    await makeAdmin(admin);
    const target = await signup("등급대상");
    expect((await api(`/admin/users?email=${target.email}`, { token: target.token })).status).toBe(403);

    const page = await consolePage(await browser.newContext(), admin);
    await page.goto(`${URLS.console}/users`);
    await page.waitForLoadState("networkidle");
    await page.getByLabel("계정 이메일").fill(target.email);
    await page.getByRole("button", { name: "찾기" }).click();
    const found = page.getByRole("region", { name: "찾은 계정" });
    await expect(found).toContainText("지금 등급: 무료");

    await found.getByLabel("프로 일수").fill("7");
    await found.getByRole("button", { name: "프로로" }).click();
    await expect(found).toContainText("지금 등급: 프로");
    expect((await api<{ plan: string }>("/auth/me", { token: target.token })).body.plan).toBe("PRO");

    await found.getByRole("button", { name: "무료로" }).click();
    await expect(found).toContainText("지금 등급: 무료");
  });
});

test.describe("환불", () => {
  test("운영자가 환불하면 그 결제로 늘어난 기간이 되돌아가고, 두 번 환불하거나 사유 없이 환불할 수 없다", async ({ browser }) => {
    const admin = await signup("환불운영자");
    await makeAdmin(admin);
    const user = await signup("환불대상");
    const pay = async () => {
      const checkout = await api<{ orderId: string; amount: number }>("/billing/checkout", { token: user.token, json: { productId: "pro-30" } });
      await api("/billing/confirm", {
        token: user.token,
        json: { orderId: checkout.body.orderId, paymentKey: `mock_${checkout.body.orderId}`, amount: checkout.body.amount },
      });
      return checkout.body.orderId;
    };
    await pay();
    const second = await pay();
    const before = new Date((await api<{ planUntil: string }>("/billing/orders", { token: user.token })).body.planUntil).getTime();

    // 일반 유저는 환불할 수 없다
    expect((await api(`/admin/orders/${second}/refund`, { token: user.token, json: { reason: "셀프" } })).status).toBe(403);
    expect((await api(`/admin/orders/${second}/refund`, { token: admin.token, json: { reason: "" } })).status).toBe(400);

    const page = await consolePage(await browser.newContext(), admin);
    await page.goto(`${URLS.console}/users`);
    await page.waitForLoadState("networkidle");
    await page.getByLabel("계정 이메일").fill(user.email);
    await page.getByRole("button", { name: "찾기" }).click();
    const orders = page.getByRole("region", { name: "찾은 계정" }).getByLabel("결제 내역");
    await expect(orders.getByRole("button", { name: "환불" })).toHaveCount(2);
    await orders.getByLabel("환불 사유").fill("고객 요청");
    await orders.getByRole("button", { name: "환불" }).first().click();
    await expect(page.getByText("결제를 환불했습니다")).toBeVisible();
    await expect(orders.getByText("환불됨 · 고객 요청")).toBeVisible();

    const after = await api<{ planUntil: string; orders: { status: string }[] }>("/billing/orders", { token: user.token });
    expect(Math.round((before - new Date(after.body.planUntil).getTime()) / 86_400_000)).toBe(30);
    expect(after.body.orders.filter((o) => o.status === "REFUNDED")).toHaveLength(1);
    expect((await api<{ plan: string }>("/auth/me", { token: user.token })).body.plan).toBe("PRO");

    const [refunded] = await sql<{ id: string }>("SELECT id FROM payment_orders WHERE status = 'REFUNDED' AND \"userId\" = (SELECT id FROM users WHERE email = $1)", [user.email]);
    expect((await api(`/admin/orders/${refunded.id}/refund`, { token: admin.token, json: { reason: "다시" } })).status).toBe(409);
  });
});
