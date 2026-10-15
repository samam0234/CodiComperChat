import { expect, test } from "@playwright/test";
import { api, makeAdmin, passedDraft, signedInPage, signup, uniq, type User } from "../helpers";

// 가짜 LLM의 검수기는 그림 바이트 안의 표시로 갈래를 정한다 (services/ai/app/services/image_moderation.py의 _fake)
const PNG_HEAD = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const png = (mark = "") => Buffer.concat([PNG_HEAD, Buffer.from(mark), Buffer.alloc(40)]);

const put = (user: User, draftId: string, data: Buffer) =>
  api<{ portraitReview: string | null; portraitReviewNote: string | null; message?: string }>(
    `/studio/characters/${draftId}/portrait`,
    { token: user.token, method: "PUT", raw: { type: "image/png", body: data } },
  );

async function publish(user: User, draftId: string) {
  await api(`/studio/characters/${draftId}/visibility`, { token: user.token, method: "PATCH", json: { visibility: "PUBLIC" } });
  return (await api<{ characterId: string }>(`/studio/characters/${draftId}/publish`, { token: user.token, method: "POST" })).body.characterId;
}

test.describe("초상 자동 검수", () => {
  test("문제 없는 그림은 바로 승인돼 남에게 보이고, 명백히 안 되는 그림은 올라가지 않는다", async () => {
    const owner = await signup("검수통과");
    const draftId = await passedDraft(owner, uniq("검수캐릭터"));

    const blocked = await put(owner, draftId, png("E2E-BLOCK"));
    expect(blocked.status).toBe(400);
    expect(blocked.body.message).toContain("올릴 수 없어요");
    expect((await api(`/studio/characters/${draftId}/portrait`, { token: owner.token })).status).toBe(404);

    const ok = await put(owner, draftId, png());
    expect(ok.status).toBe(200);
    expect(ok.body.portraitReview).toBe("APPROVED");
    const cid = await publish(owner, draftId);
    expect((await api(`/characters/${cid}/portrait`)).status).toBe(200);
  });

  test("애매한 그림은 운영자 확인 전까지 남에게 안 보이고, 운영자가 승인하면 보인다", async ({ browser }) => {
    const owner = await signup("검수대기");
    const admin = await signup("검수운영자");
    await makeAdmin(admin);
    const name = uniq("대기캐릭터");
    const draftId = await passedDraft(owner, name);

    const pending = await put(owner, draftId, png("E2E-REVIEW"));
    expect(pending.status).toBe(200);
    expect(pending.body.portraitReview).toBe("PENDING");
    expect(pending.body.portraitReviewNote).toContain("실존 인물");
    const cid = await publish(owner, draftId);
    // 발행은 되지만 초상 없이 나간다
    expect((await api(`/characters/${cid}/portrait`)).status).toBe(404);

    // 만든 사람은 공방에서 "운영자 확인 중"을 본다
    const ownerPage = await signedInPage(await browser.newContext(), owner);
    await ownerPage.goto(`/studio/${draftId}`);
    await ownerPage.waitForLoadState("networkidle");
    await ownerPage.getByLabel("공방 단계").getByRole("button", { name: /외형/ }).click();
    await expect(ownerPage.getByText("운영자 확인 중")).toBeVisible();

    // 일반 유저는 검수 목록을 못 본다
    expect((await api("/admin/portraits", { token: owner.token })).status).toBe(403);

    // 운영자 화면에서 승인
    const adminPage = await signedInPage(await browser.newContext(), admin);
    await adminPage.goto("/admin/portraits");
    await adminPage.waitForLoadState("networkidle");
    const item = adminPage.getByRole("listitem", { name: `${name} 초상` });
    await expect(item).toBeVisible();
    await expect.poll(() => item.locator("img").evaluate((el: HTMLImageElement) => el.complete)).toBe(true);
    await item.getByRole("button", { name: "승인" }).click();
    await expect(item).toHaveCount(0);

    expect((await api(`/characters/${cid}/portrait`)).status).toBe(200);
  });

  test("운영자가 반려하면 사유가 만든 사람에게 보이고, 사유 없이는 반려할 수 없다", async () => {
    const owner = await signup("검수반려");
    const admin = await signup("반려운영자");
    await makeAdmin(admin);
    const draftId = await passedDraft(owner, uniq("반려캐릭터"));
    await put(owner, draftId, png("E2E-REVIEW"));

    const noNote = await api(`/admin/portraits/${draftId}`, { token: admin.token, json: { decision: "reject", note: "" } });
    expect(noNote.status).toBe(400);
    const rejected = await api(`/admin/portraits/${draftId}`, { token: admin.token, json: { decision: "reject", note: "다른 작가의 그림으로 보입니다" } });
    expect(rejected.status).toBe(204);

    const view = await api<{ portraitReview: string; portraitReviewNote: string }>(`/studio/characters/${draftId}`, { token: owner.token });
    expect(view.body.portraitReview).toBe("REJECTED");
    expect(view.body.portraitReviewNote).toBe("다른 작가의 그림으로 보입니다");

    // 새 그림을 올리면 다시 검수한다
    expect((await put(owner, draftId, png())).body.portraitReview).toBe("APPROVED");
  });
});
