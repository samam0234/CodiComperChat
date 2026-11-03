import { expect, test } from "@playwright/test";
import { URLS } from "../env.mjs";
import { api, consolePage, makeAdmin, signup } from "../helpers";

test.describe("운영 콘솔 · 생년월일 고치기", () => {
  test("일반 계정은 못 하고, 운영자가 고치면 나이가 바뀌고 성인 확인이 풀린다", async ({ browser }) => {
    const user = await signup("생일정정", { verified: true });
    const admin = await signup("생일운영");
    await makeAdmin(admin);

    // 이용자가 잘못 넣은 미래가 아닌 날짜: 성인 확인까지 마친 상태
    const confirmed = await api("/auth/me/adult", { token: user.token, json: { birthDate: "1990-01-01", consent: true } });
    expect(confirmed.status).toBe(200);
    const fix = (token: string, json: unknown) => api("/admin/users/birthdate", { token, json });
    expect((await fix(user.token, { email: user.email, birthDate: "1980-01-01", reason: "시도" })).status).toBe(403);
    expect((await fix(admin.token, { email: user.email, birthDate: "1980-01-01" })).status).toBe(400);
    expect((await fix(admin.token, { email: user.email, birthDate: "내일", reason: "형식" })).status).toBe(400);
    expect((await fix(admin.token, { email: user.email, birthDate: "2999-01-01", reason: "미래" })).status).toBe(400);
    expect((await fix(admin.token, { email: "없는계정@example.com", birthDate: "1980-01-01", reason: "없음" })).status).toBe(404);

    const page = await consolePage(await browser.newContext(), admin);
    await page.goto(`${URLS.console}/users`);
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("계정 이메일").fill(user.email);
    await page.getByRole("button", { name: "찾기" }).click();
    const found = page.getByRole("region", { name: "찾은 계정" });
    await expect(found).toContainText(/나이 확인: 만 \d+세/);
    await found.getByLabel("새 생년월일").fill("2015-05-05");
    await found.getByLabel("고치는 사유").fill("이용자 요청, 입력 실수");
    await found.getByRole("button", { name: "생년월일 고치기" }).click();
    await expect(page.getByText("생년월일을 고쳤습니다")).toBeVisible();
    await expect(found).not.toContainText("입력 안 함");

    const me = await api<{ adult: boolean; birthDateSet: boolean }>("/auth/me", { token: user.token });
    expect(me.body).toMatchObject({ adult: false, birthDateSet: true });
    // 날짜 자체는 응답에 없다
    expect(JSON.stringify(me.body)).not.toContain("2015");
    const looked = await api<Record<string, unknown>>(`/admin/users?email=${encodeURIComponent(user.email)}`, { token: admin.token });
    expect(looked.body).not.toHaveProperty("birthDate");

    // 비우면 지워서 이용자가 다시 넣을 수 있다
    await found.getByRole("button", { name: "생년월일 고치기" }).click();
    await expect(page.getByText("고치는 사유를 적어 주세요.")).toBeVisible();
    await found.getByLabel("고치는 사유").fill("다시 입력하도록");
    await found.getByRole("button", { name: "생년월일 고치기" }).click();
    await expect(found).toContainText("입력 안 함");
    expect((await api("/auth/me/birthdate", { token: user.token, json: { birthDate: "2000-02-02" } })).status).toBe(200);
  });
});
