import { expect, test, type Browser, type Page } from "@playwright/test";
import { api, fullCard, passedDraft, publishedCharacter, signedInPage, signup, uniq, type User } from "../helpers";

async function open(browser: Browser, user: User, path: string) {
  const context = await browser.newContext();
  const page = await signedInPage(context, user);
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  return { context, page };
}

const step = (page: Page, name: RegExp) => page.getByLabel("공방 단계").getByRole("button", { name });

// 작은 PNG(브라우저 캔버스로 만든다). 서버는 매직 바이트까지 검사한다
async function makePng(page: Page, width = 800, height = 500) {
  const dataUrl = await page.evaluate(([w, h]) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    g.fillStyle = "#3d5afe";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#ff8a65";
    g.beginPath();
    g.arc(w / 2, h / 2, h / 3, 0, 7);
    g.fill();
    return c.toDataURL("image/png");
  }, [width, height]);
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

test.describe("캐릭터 공방", () => {
  test("초안을 만들고 입력하면 자동 저장되어 새로고침해도 남는다", async ({ browser }) => {
    const user = await signup("저장");
    const { context, page } = await open(browser, user, "/studio");
    await page.getByRole("button", { name: "새 캐릭터 만들기" }).click();
    await expect(page).toHaveURL(/\/studio\/[^/]+$/);
    await page.waitForLoadState("networkidle");

    await page.getByLabel(/^이름/).fill("자동저장");
    await expect(page.getByText("저장됨", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/^이름/)).toHaveValue("자동저장");
    // 비어 있는 필수 단계를 미리보기가 알려 준다
    await expect(page.getByLabel("라이브 미리보기")).toContainText("필수 단계를 모두 채워야 합니다");
    await context.close();
  });

  test("필수 단계를 채우고 3턴 테스트를 통과하면 발행할 수 있다", async ({ browser }) => {
    const user = await signup("발행");
    const name = uniq("발행캐릭터");
    const draftId = await passedDraft(user, name);
    const { context, page } = await open(browser, user, `/studio/${draftId}`);

    const publish = page.getByRole("button", { name: "발행", exact: true });
    await expect(page.getByLabel("라이브 미리보기")).toContainText("테스트 3턴 통과");
    await expect(publish).toBeEnabled();
    await page.locator("header select").selectOption("PUBLIC");
    await expect(page.getByText("저장됨", { exact: true })).toBeVisible();
    await publish.click();
    await expect(page.getByText("발행했습니다")).toBeVisible();
    await expect(page.getByText("발행됨 · 공개")).toBeVisible();

    const list = await api<{ name: string }[]>("/characters");
    expect(list.body.map((c) => c.name)).toContain(name);
    await context.close();
  });

  test("카드를 고치면 이전 테스트가 무효가 되어 다시 발행할 수 없다", async ({ browser }) => {
    const user = await signup("무효");
    const { draftId } = await publishedCharacter(user, uniq("무효캐릭터"));
    const { context, page } = await open(browser, user, `/studio/${draftId}`);
    await step(page, /캠페인 역할/).click();
    await page.getByRole("textbox", { name: /^유저에게 거는 태도/ }).fill("조금 달라진 태도");
    await expect(page.getByText("저장됨", { exact: true })).toBeVisible();
    await expect(page.getByText("이전 테스트가 무효")).toBeVisible();
    await expect(page.getByRole("button", { name: "다시 발행" })).toBeDisabled();
    await context.close();
  });

  test("성격·말투 단계에서 말투 샘플 답 2개를 본다", async ({ browser }) => {
    const user = await signup("샘플");
    const draftId = await passedDraft(user, uniq("샘플캐릭터"));
    const { context, page } = await open(browser, user, `/studio/${draftId}`);
    await step(page, /성격·말투/).click();
    await page.getByRole("button", { name: "샘플 답 보기" }).click();
    const region = page.getByRole("region", { name: "말투 샘플" });
    await expect(region.getByText("지금 뭐 해?")).toBeVisible();
    await expect(region.getByText("네, 알겠어요. 오늘도 천천히 이야기해 봐요.")).toHaveCount(2);
    // 3턴 테스트에는 포함되지 않는다
    const view = await api<{ test: { turnsUsed: number } }>(`/studio/characters/${draftId}`, { token: user.token });
    expect(view.body.test.turnsUsed).toBe(3);
    await context.close();
  });

  test("AI 초안은 제안만 보여 주고 적용해야 칸에 들어간다. 비밀 칸에는 버튼이 없다", async ({ browser }) => {
    const user = await signup("초안");
    const { body } = await api<{ id: string }>("/studio/characters", { token: user.token, method: "POST" });
    await api(`/studio/characters/${body.id}`, { token: user.token, method: "PATCH", json: { card: fullCard("초안캐릭터") } });
    const { context, page } = await open(browser, user, `/studio/${body.id}`);

    await page.getByRole("textbox", { name: /^한 줄 소개/ }).fill("");
    await page.getByRole("button", { name: "한 줄 소개 AI 초안" }).click();
    const proposal = page.getByRole("group", { name: "한 줄 소개 AI 초안 제안" });
    await expect(proposal).toContainText("테스트 초안이에요");
    await expect(page.getByRole("textbox", { name: /^한 줄 소개/ })).toHaveValue("");
    await proposal.getByRole("button", { name: "적용하기" }).click();
    await expect(page.getByRole("textbox", { name: /^한 줄 소개/ })).toHaveValue(/테스트 초안이에요/);

    await step(page, /비밀·경계/).click();
    await expect(page.getByRole("button", { name: /^비밀 AI 초안/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /해금 조건 AI 초안/ })).toHaveCount(0);
    const refused = await api(`/studio/characters/${body.id}/draft-field`, { token: user.token, json: { field: "boundary.secret" } });
    expect(refused.status).toBe(400);
    await context.close();
  });

  test("긴 글 칸의 프롬프트 연장 버튼은 프로 등급 안내를 띄운다", async ({ browser }) => {
    const user = await signup("연장");
    const { body } = await api<{ id: string }>("/studio/characters", { token: user.token, method: "POST" });
    const { context, page } = await open(browser, user, `/studio/${body.id}`);
    await step(page, /캠페인 역할/).click();
    await page.getByRole("button", { name: "시작 장면 프롬프트 연장" }).click();
    const dialog = page.getByRole("dialog", { name: /프로등급/ });
    await expect(dialog).toContainText("이 기능을 사용하실려면 프로등급으로 전환해야 합니다.");
    await dialog.getByRole("button", { name: "확인" }).click();
    await expect(dialog).toBeHidden();
    await context.close();
  });

  test("초상을 올리면 미리보기·발행 뒤 목록에 보이고, 비공개 캐릭터의 초상은 남이 못 본다", async ({ browser }) => {
    const owner = await signup("초상");
    const other = await signup("남");
    const name = uniq("초상캐릭터");
    const draftId = await passedDraft(owner, name);
    const { context, page } = await open(browser, owner, `/studio/${draftId}`);

    await step(page, /외형/).click();
    const region = page.getByRole("region", { name: "흉상 초상" });
    await expect(region).toContainText("초상 없음");
    await region.locator("input[type=file]").setInputFiles({ name: "art.png", mimeType: "image/png", buffer: await makePng(page) });
    const art = region.getByRole("img", { name: "올린 흉상 초상" });
    await expect(art).toBeVisible();
    await expect.poll(() => art.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBe(320);

    // 서버가 정사각형·150KB 이하로 저장했다
    const stored = await api<Buffer>(`/studio/characters/${draftId}/portrait`, { token: owner.token });
    expect(stored.status).toBe(200);
    expect(stored.body.length).toBeLessThanOrEqual(150_000);

    await api(`/studio/characters/${draftId}/visibility`, { token: owner.token, method: "PATCH", json: { visibility: "PRIVATE" } });
    const published = await api<{ characterId: string }>(`/studio/characters/${draftId}/publish`, { token: owner.token, method: "POST" });
    const cid = published.body.characterId;
    expect((await api(`/characters/${cid}/portrait`, { token: owner.token })).status).toBe(200);
    expect((await api(`/characters/${cid}/portrait`, { token: other.token })).status).toBe(404);
    expect((await api(`/characters/${cid}/portrait`)).status).toBe(404);

    // 공개로 바꾸면 홈 목록 카드에 초상이 나온다
    await api(`/studio/characters/${draftId}/visibility`, { token: owner.token, method: "PATCH", json: { visibility: "PUBLIC" } });
    const otherCtx = await browser.newContext();
    const otherPage = await signedInPage(otherCtx, other);
    await otherPage.goto("/");
    const card = otherPage.locator("li", { hasText: name }).first();
    await expect(card.locator("img")).toHaveCount(1);
    await expect.poll(() => card.locator("img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);

    await region.getByRole("button", { name: "지우기" }).click();
    await expect(region).toContainText("초상 없음");
    expect((await api(`/characters/${cid}/portrait`)).status).toBe(404);
    await otherCtx.close();
    await context.close();
  });

  test("서버는 그림이 아닌 파일·너무 큰 파일·허용하지 않는 형식을 거절한다", async () => {
    const user = await signup("거절");
    const { body } = await api<{ id: string }>("/studio/characters", { token: user.token, method: "POST" });
    const put = (type: string, data: Buffer) => api(`/studio/characters/${body.id}/portrait`, { token: user.token, method: "PUT", raw: { type, body: data } });
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]);
    expect((await put("image/png", Buffer.from("<script>alert(1)</script> padding padding"))).status).toBe(400);
    expect((await put("image/gif", Buffer.from("GIF89a....."))).status).toBe(400);
    expect((await put("image/png", Buffer.concat([png, Buffer.alloc(200_000)]))).status).toBe(400);
    expect((await put("image/png", Buffer.alloc(400_000))).status).toBe(413);
    expect((await put("image/png", png)).status).toBe(200);
  });

  test("공개 범위: 링크 공개는 목록에 없지만 주소로 열리고, 비공개는 남이 못 연다", async () => {
    const owner = await signup("범위");
    const other = await signup("구경");
    const unlisted = await publishedCharacter(owner, uniq("링크공개"), "UNLISTED");
    const hidden = await publishedCharacter(owner, uniq("비공개"), "PRIVATE");

    const list = (await api<{ id: string }[]>("/characters")).body.map((c) => c.id);
    expect(list).not.toContain(unlisted.characterId);
    expect(list).not.toContain(hidden.characterId);
    expect((await api(`/characters/${unlisted.characterId}`, { token: other.token })).status).toBe(200);
    expect((await api(`/characters/${hidden.characterId}`, { token: other.token })).status).toBe(404);
    expect((await api(`/characters/${hidden.characterId}`, { token: owner.token })).status).toBe(200);
  });
});
