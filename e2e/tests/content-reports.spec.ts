import { expect, test, type Browser, type Locator } from "@playwright/test";
import { URLS } from "../env.mjs";
import { OFFICIAL_ID, api, chat, consolePage, createPersona, makeAdmin, signedInPage, signup, uniq, type User } from "../helpers";

const CHAT = `/characters/${OFFICIAL_ID}/chat`;
const OPS = `${CHAT}/ops`;

// 그림을 하나 만든 계정 (detail은 콘솔에서 이 신고를 찾는 표시로 쓴다)
async function artist(tag: string): Promise<User> {
  const user = await signup(tag);
  const personaId = await createPersona(user, "민준");
  expect((await chat(user, OFFICIAL_ID, personaId, "안녕하세요 선생님")).status).toBe(200);
  await api("/me/attendance", { token: user.token, method: "POST" });
  const made = await api(`${OPS}/photonet`, { token: user.token, json: { prompt: "비 오는 카페 창가", style: "수채화", ratio: "세로" } });
  expect(made.status).toBe(200);
  return user;
}

async function reportFromGallery(browser: Browser, user: User, reason: string, detail: string) {
  const page = await signedInPage(await browser.newContext(), user);
  await page.goto(CHAT);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "코디포토넷" }).click();
  const gallery = page.getByRole("dialog", { name: "코디포토넷" }).getByRole("region", { name: "만든 그림" });
  await gallery.getByRole("button", { name: "신고", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "이 그림을 신고" });
  await dialog.getByLabel("사유").selectOption({ label: reason });
  await dialog.getByLabel(/자세한 내용/).fill(detail);
  await dialog.getByRole("button", { name: "신고하기" }).click();
  await expect(dialog).toContainText("운영자가 그림을 확인해 처리합니다");
  await dialog.getByRole("button", { name: "닫기" }).click();
  return page;
}

async function adminBoard(browser: Browser) {
  const admin = await signup("그림신고운영");
  await makeAdmin(admin);
  const page = await consolePage(await browser.newContext(), admin);
  await page.goto(`${URLS.console}/content`);
  await page.waitForLoadState("networkidle");
  return page;
}

const entry = (scope: Locator, text: string) => scope.getByRole("listitem").filter({ hasText: text });

test.describe("그림 신고 (화면)", () => {
  test("이용자가 신고하면 콘솔에 올라오고, 접근을 막으면 그림이 닫히고 신고 버튼이 사라진다", async ({ browser }) => {
    const user = await artist("그림신고");
    const detail = uniq("차단확인");
    const page = await reportFromGallery(browser, user, "실사와 너무 비슷함", detail);

    const board = await adminBoard(browser);
    const item = entry(board.locator("main"), detail);
    await expect(item).toContainText("실사와 너무 비슷함");
    // 운영자가 신고된 그림을 실제로 볼 수 있다 (중계 라우트와 콘솔 CSP를 함께 지난다)
    await expect.poll(() => item.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await item.getByLabel("처리 사유").fill("실사에 가까움");
    await item.getByRole("button", { name: "접근 차단" }).click();
    await expect(entry(board.locator("main"), detail)).toHaveCount(0);
    await expect(board.getByText("실사에 가까움")).toBeVisible();

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "코디포토넷" }).click();
    const gallery = page.getByRole("dialog", { name: "코디포토넷" }).getByRole("region", { name: "만든 그림" });
    await expect(gallery).toContainText("운영 조치로 볼 수 없는 그림입니다");
    await expect(gallery.getByRole("button", { name: "신고", exact: true })).toHaveCount(0);
  });

  test("문제없음으로 닫으면 그림이 그대로 보인다", async ({ browser }) => {
    const user = await artist("그림기각");
    const detail = uniq("기각확인");
    const page = await reportFromGallery(browser, user, "기타", detail);

    const board = await adminBoard(browser);
    const item = entry(board.locator("main"), detail);
    await item.getByRole("button", { name: "문제없음" }).click();
    await expect(entry(board.locator("main"), detail)).toHaveCount(0);

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "코디포토넷" }).click();
    const gallery = page.getByRole("dialog", { name: "코디포토넷" }).getByRole("region", { name: "만든 그림" });
    await expect(gallery.getByRole("img")).toHaveCount(1);
    await expect(gallery).not.toContainText("운영 조치로 볼 수 없는 그림입니다");
  });

  test("차단하고 계정을 정지하면 그 계정이 막히고, 정지를 풀면 다시 쓴다", async ({ browser }) => {
    const user = await artist("그림정지");
    const detail = uniq("정지확인");
    await reportFromGallery(browser, user, "미성년자로 보임", detail);

    const board = await adminBoard(browser);
    const item = entry(board.locator("main"), detail);
    await item.getByLabel("처리 사유").fill("정지 사유 확인");
    await item.getByRole("button", { name: "차단하고 계정 정지" }).click();
    const blocked = entry(board.locator("main"), "정지 사유 확인");
    await expect(blocked).toContainText("계정 정지");
    expect((await api("/auth/me", { token: user.token })).status).toBe(403);

    await blocked.getByRole("button", { name: "계정 정지 해제" }).click();
    await expect(blocked.getByRole("button", { name: "계정 정지 해제" })).toHaveCount(0);
    expect((await api("/auth/me", { token: user.token })).status).toBe(200);
  });
});
