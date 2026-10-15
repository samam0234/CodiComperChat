import { expect, test } from "@playwright/test";
import { api, makeAdmin, publishedCharacter, signedInPage, signup, uniq } from "../helpers";

test.describe("신고와 운영자 처리", () => {
  test("신고 → 운영자 내리기 → 숨김·주인 안내 → 복구", async ({ browser }) => {
    const owner = await signup("주인");
    const reporter = await signup("신고자");
    const admin = await signup("운영자");
    await makeAdmin(admin);
    const name = uniq("신고대상");
    const { characterId, draftId } = await publishedCharacter(owner, name);

    // 신고자: 상세에서 신고
    const reporterCtx = await browser.newContext();
    const reporterPage = await signedInPage(reporterCtx, reporter);
    await reporterPage.goto(`/characters/${characterId}`);
    await reporterPage.waitForLoadState("networkidle");
    await reporterPage.getByRole("button", { name: "신고하기" }).first().click();
    const dialog = reporterPage.getByRole("dialog", { name: /신고/ });
    await expect(dialog.getByRole("button", { name: "신고하기" })).toBeDisabled();
    await dialog.getByRole("combobox").selectOption("OTHER");
    await expect(dialog.getByRole("button", { name: "신고하기" })).toBeDisabled(); // 기타는 내용이 필요
    await dialog.locator("textarea").fill("부적절한 설정이 있어요");
    await dialog.getByRole("button", { name: "신고하기" }).click();
    await expect(reporterPage.getByText("신고했습니다")).toBeVisible();
    expect((await api(`/characters/${characterId}/report`, { token: reporter.token, json: { reason: "SPAM" } })).status).toBe(409);
    expect((await api(`/characters/${characterId}/report`, { token: owner.token, json: { reason: "SPAM" } })).status).toBe(400);

    // 일반 유저는 신고함을 못 본다
    expect((await reporterPage.goto("/admin/reports"))?.status()).toBe(404);
    expect((await api("/admin/reports", { token: reporter.token })).status).toBe(403);

    // 운영자: 신고함에서 사유를 쓰고 내린다
    const adminCtx = await browser.newContext();
    const adminPage = await signedInPage(adminCtx, admin);
    await adminPage.goto("/admin/reports");
    await adminPage.waitForLoadState("networkidle");
    const card = adminPage.locator("li", { hasText: name }).first();
    await expect(card).toContainText("신고 1건");
    await expect(card).toContainText("부적절한 설정이 있어요");
    await card.getByRole("button", { name: "캐릭터 내리기" }).click();
    const takedown = adminPage.getByRole("dialog", { name: /내릴까요/ });
    await takedown.getByRole("button", { name: "내리기" }).click();
    await expect(takedown.getByText("내리는 사유를 써 주세요")).toBeVisible();
    await takedown.locator("textarea").fill("부적절해서 내렸습니다");
    await takedown.getByRole("button", { name: "내리기" }).click();
    await expect(adminPage.locator("li", { hasText: name }).getByRole("button", { name: "복구하기" })).toBeVisible();

    // 내려가면 목록·상세·대화에서 모두 사라진다 (주인도)
    expect((await api<{ id: string }[]>("/characters")).body.map((c) => c.id)).not.toContain(characterId);
    expect((await api(`/characters/${characterId}`, { token: reporter.token })).status).toBe(404);
    expect((await api(`/characters/${characterId}`, { token: owner.token })).status).toBe(404);
    expect((await api(`/characters/${characterId}/chat`, { token: reporter.token })).status).toBe(404);

    // 주인은 공방에서 사유를 보고 다시 발행할 수 없다
    const ownerCtx = await browser.newContext();
    const ownerPage = await signedInPage(ownerCtx, owner);
    await ownerPage.goto(`/studio/${draftId}`);
    await expect(ownerPage.getByText("운영자가 이 캐릭터를 내렸습니다")).toBeVisible();
    await expect(ownerPage.getByText("부적절해서 내렸습니다").first()).toBeVisible();
    expect((await api(`/studio/characters/${draftId}/publish`, { token: owner.token, method: "POST" })).status).toBe(409);

    // 복구하면 돌아온다
    await adminPage.locator("li", { hasText: name }).getByRole("button", { name: "복구하기" }).click();
    await expect(adminPage.locator("li", { hasText: name }).getByRole("button", { name: "복구하기" })).toBeHidden();
    expect((await api(`/characters/${characterId}`, { token: reporter.token })).status).toBe(200);

    await Promise.all([reporterCtx.close(), adminCtx.close(), ownerCtx.close()]);
  });

  test("신고 기각은 캐릭터를 그대로 두고 신고만 닫는다", async () => {
    const owner = await signup("기각주인");
    const reporter = await signup("기각신고");
    const admin = await signup("기각운영");
    await makeAdmin(admin);
    const { characterId } = await publishedCharacter(owner, uniq("기각대상"));
    expect((await api(`/characters/${characterId}/report`, { token: reporter.token, json: { reason: "SPAM", detail: "광고 같아요" } })).status).toBe(204);

    const open = await api<{ open: { character: { id: string } }[] }>("/admin/reports", { token: admin.token });
    expect(open.body.open.map((g) => g.character.id)).toContain(characterId);
    expect((await api(`/admin/characters/${characterId}/dismiss-reports`, { token: admin.token, json: { note: "문제 없음" } })).status).toBe(204);
    const after = await api<{ open: { character: { id: string } }[] }>("/admin/reports", { token: admin.token });
    expect(after.body.open.map((g) => g.character.id)).not.toContain(characterId);
    expect((await api(`/characters/${characterId}`, { token: reporter.token })).status).toBe(200);
  });
});
