import { expect, test } from "@playwright/test";
import { OFFICIAL_ID, api, chat, createPersona, signedInPage, signup } from "../helpers";

const CHAT = `/characters/${OFFICIAL_ID}/chat`;

async function open(browser: import("@playwright/test").Browser, user: Awaited<ReturnType<typeof signup>>, path = CHAT) {
  const context = await browser.newContext();
  const page = await signedInPage(context, user);
  await page.goto(path);
  // 개발 서버는 첫 로딩 때 하이드레이션이 늦어, 끝나기 전에 누르면 입력이 무시된다
  await page.waitForLoadState("networkidle");
  return { context, page };
}

async function say(page: import("@playwright/test").Page, text: string) {
  await page.getByPlaceholder(/에게 말 걸기/).fill(text);
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(page.getByText(text).first()).toBeVisible();
  await expect(page.getByText(/가 답하는 중/)).toBeHidden();
}

test.describe("캐릭터 대화", () => {
  test("프로필이 없으면 만들라고 안내한다", async ({ browser }) => {
    const user = await signup("무프로필");
    const { context, page } = await open(browser, user);
    await expect(page.getByText("대화하려면 내 프로필 캐릭터가 필요해요")).toBeVisible();
    await expect(page.getByRole("link", { name: "프로필 캐릭터 만들기" })).toBeVisible();
    await context.close();
  });

  test("프로필을 고르기 전에는 못 보내고, 첫 대화 뒤에는 프로필이 잠긴다", async ({ browser }) => {
    const user = await signup("잠금");
    await createPersona(user, "민준");
    await createPersona(user, "서연");
    const { context, page } = await open(browser, user);

    await expect(page.getByPlaceholder("먼저 프로필을 골라요")).toBeDisabled();
    await page.locator("#persona-select").selectOption({ label: "민준" });
    await say(page, "안녕하세요 선생님");
    await expect(page.getByText("네, 알겠어요. 오늘도 천천히 이야기해 봐요.").first()).toBeVisible();
    await expect(page.locator("#persona-select")).toBeDisabled();
    await expect(page.getByText("이 대화에서는 바꿀 수 없어요")).toBeVisible();

    // 서버도 다른 프로필로 보내는 것을 막는다
    const other = await api<{ id: string }[]>("/me/personas", { token: user.token });
    const seoyeon = other.body.find((p: any) => p.name === "서연")!;
    const blocked = await chat(user, OFFICIAL_ID, seoyeon.id, "다른 프로필로");
    expect(blocked.status).toBe(409);
    await context.close();
  });

  test("새로하기(저장) → 이어하기로 그 대화를 되살린다", async ({ browser }) => {
    const user = await signup("이어");
    const personaId = await createPersona(user, "민준");
    await chat(user, OFFICIAL_ID, personaId, "저장할 첫 대화예요");
    const { context, page } = await open(browser, user);

    await expect(page.getByText("저장할 첫 대화예요")).toBeVisible();
    await page.getByRole("button", { name: "새로하기" }).click();
    const dialog = page.getByRole("dialog", { name: "대화를 저장하시겠습니까?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "저장하겠습니다" }).click();
    await expect(page.getByText("대화를 저장하고 새로 시작했어요")).toBeVisible();
    await expect(page.getByText("저장할 첫 대화예요")).toBeHidden();
    await expect(page.locator("#persona-select")).toBeEnabled();
    await expect(page.getByRole("link", { name: /이어하기/ })).toContainText("1");

    await page.getByRole("link", { name: /이어하기/ }).click();
    await expect(page).toHaveURL(/\/chat\/saved$/);
    await expect(page.getByText("저장할 첫 대화예요").first()).toBeVisible();
    await page.getByRole("button", { name: /이어하기 →/ }).click();
    await expect(page).toHaveURL(new RegExp(`${CHAT}$`));
    await expect(page.getByText("저장할 첫 대화예요")).toBeVisible();
    await expect(page.locator("#persona-select")).toBeDisabled();
    await context.close();
  });

  test("새로하기(저장 안 함)는 대화를 지우고 처음부터 시작한다", async ({ browser }) => {
    const user = await signup("초기화");
    const personaId = await createPersona(user, "민준");
    await chat(user, OFFICIAL_ID, personaId, "지워질 대화예요");
    const { context, page } = await open(browser, user);

    await page.getByRole("button", { name: "새로하기" }).click();
    await page.getByRole("dialog", { name: "대화를 저장하시겠습니까?" }).getByRole("button", { name: "저장 안 함" }).click();
    await expect(page.getByText("새 대화를 시작했어요")).toBeVisible();
    await expect(page.getByText("지워질 대화예요")).toBeHidden();
    const saved = await api<{ saved: unknown[] }>(`${CHAT}/saved`, { token: user.token });
    expect(saved.body.saved).toHaveLength(0);
    await context.close();
  });

  test("엑스트라를 만들고 이 대화에 적용한다", async ({ browser }) => {
    const user = await signup("엑스트라");
    await createPersona(user, "민준");
    const { context, page } = await open(browser, user);

    await page.getByRole("button", { name: /엑스트라 설정/ }).click();
    const panel = page.getByRole("region", { name: "엑스트라 설정" });
    await expect(panel).toContainText("적용 0/3");
    await panel.getByRole("button", { name: "+ 새 엑스트라" }).click();
    await panel.getByLabel(/^이름/).fill("지아");
    await panel.getByLabel(/^한 줄 소개/).fill("선생님의 여동생");
    await panel.getByLabel(/^인물 관계/).fill("선생님의 여동생");
    await panel.getByRole("button", { name: "만들기" }).click();
    await expect(panel.locator("select")).toContainText("지아");

    await panel.locator("select").selectOption({ label: "지아 — 선생님의 여동생" });
    // 칸이 빈 조건(상황)은 고를 수 없다
    await expect(panel.getByRole("checkbox", { name: "상황" })).toBeDisabled();
    await panel.getByRole("checkbox", { name: "인물 관계" }).check();
    await panel.getByRole("button", { name: "이 대화에 적용" }).click();
    await expect(panel).toContainText("적용 1/3");
    await expect(panel).toContainText("조건: 인물 관계");
    await context.close();
  });

  test("대화가 3번 오가면 지난 이야기·친밀도·복선이 정리된다", async ({ browser }) => {
    const user = await signup("이야기");
    const personaId = await createPersona(user, "민준");
    for (const m of ["속마음을 털어놓을게요", "고마워요 선생님", "다음 주에 또 만나요"]) {
      expect((await chat(user, OFFICIAL_ID, personaId, m)).status).toBe(200);
    }
    const { context, page } = await open(browser, user);
    const panel = page.getByRole("region", { name: "지난 이야기" });
    await panel.getByRole("button", { name: /지난 이야기/ }).click();
    // 정리는 답 뒤에서 하므로 끝날 때까지 새로고침한다
    await expect(async () => {
      await panel.getByRole("button", { name: "새로고침" }).click();
      await expect(panel).toContainText("지금까지의 이야기", { timeout: 2_000 });
    }).toPass({ timeout: 60_000 });
    await expect(panel).toContainText("민준이 속마음을 털어놓았고");
    await expect(panel).toContainText("다음 주에 다시 만나기로 했다");
    await expect(panel).toContainText("+2");

    const story = await api<{ relation: { value: number } }>(`${CHAT}/story`, { token: user.token });
    expect(story.body.relation.value).toBe(2);
    await context.close();
  });
});
