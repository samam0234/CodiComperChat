import { expect, test } from "@playwright/test";
import { OFFICIAL_ID, createPersona, signedInPage, signup } from "../helpers";

const CHAT = `/characters/${OFFICIAL_ID}/chat`;

test.describe("대화 글 꾸미기", () => {
  test("인라인 표기: *기울임* **굵게** ***굵은 기울임*** ~취소선~ `코드`, {{user}}는 내 이름으로", async ({ browser }) => {
    const user = await signup("꾸밈인라인");
    await createPersona(user, "민준");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");
    await page.locator("#persona-select").selectOption({ label: "민준" });

    await page.getByPlaceholder(/에게 말 걸기/).fill("*고개를 든다* **안녕** ***정말*** ~아니~ `코드` 나는 {{user}}야 안녕~잘가~");
    await page.getByRole("button", { name: "보내기" }).click();
    await expect(page.getByText(/가 답하는 중/)).toBeHidden();

    const mine = page.getByRole("log").locator("div", { hasText: "고개를 든다" }).last();
    await expect(mine.locator("em", { hasText: "고개를 든다" })).toBeVisible();
    await expect(mine.locator("strong", { hasText: /^안녕$/ })).toBeVisible();
    await expect(mine.locator("strong > em", { hasText: "정말" })).toBeVisible();
    await expect(mine.locator("del", { hasText: "아니" })).toBeVisible();
    await expect(mine.locator("code", { hasText: "코드" })).toBeVisible();
    await expect(mine).toContainText("나는 민준야");
    // 글자 옆의 ~는 말투라서 취소선이 되지 않는다
    await expect(mine.locator("del")).toHaveCount(1);
    await expect(mine).toContainText("안녕~잘가~");
  });

  test("블록 표기: 제목·구분선·인용·여백·목록·상자·정보창·말한 사람·서술", async ({ browser }) => {
    const user = await signup("꾸밈블록");
    await createPersona(user, "민준");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");
    await page.locator("#persona-select").selectOption({ label: "민준" });

    const text = [
      "# 큰 제목",
      "### 작은 제목",
      "---",
      "> 선 있는 인용",
      ">위아래 여백",
      "* 목록 하나",
      "* 목록 둘",
      "```상자 안의 글```",
      "```InfoBox 상태창",
      "호감도 *10*",
      "```",
      "@하루 안녕하세요",
      "@ 비가 내린다",
    ].join("\n");
    await page.getByPlaceholder(/에게 말 걸기/).fill(text);
    await page.getByRole("button", { name: "보내기" }).click();
    await expect(page.getByText(/가 답하는 중/)).toBeHidden();

    const log = page.getByRole("log");
    await expect(log.getByRole("heading", { name: "큰 제목" })).toBeVisible();
    await expect(log.getByRole("heading", { name: "작은 제목" })).toBeVisible();
    await expect(log.locator("hr")).toHaveCount(1);
    await expect(log.locator("blockquote", { hasText: "선 있는 인용" })).toBeVisible();
    await expect(log.getByText("위아래 여백")).toBeVisible();
    await expect(log.getByRole("listitem")).toHaveText(["목록 하나", "목록 둘"]);
    await expect(log.locator("pre", { hasText: "상자 안의 글" })).toBeVisible();

    // 정보창은 접고 펼 수 있다
    const info = log.locator("details", { hasText: "상태창" });
    await expect(info).toHaveAttribute("open", "");
    await info.locator("summary").click();
    await expect(info).not.toHaveAttribute("open", "");
    await expect(log.getByText("호감도")).toBeHidden();
    await info.locator("summary").click();
    await expect(log.getByText("호감도")).toBeVisible();

    await expect(log.getByText("하루", { exact: true })).toBeVisible();
    await expect(log.getByText("비가 내린다")).toBeVisible();
  });

  test("글 속 HTML은 실행되지 않고 글자로 보인다", async ({ browser }) => {
    const user = await signup("꾸밈안전");
    await createPersona(user, "민준");
    const page = await signedInPage(await browser.newContext(), user);
    let dialog = false;
    page.on("dialog", (d) => {
      dialog = true;
      void d.dismiss();
    });
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");
    await page.locator("#persona-select").selectOption({ label: "민준" });

    await page.getByPlaceholder(/에게 말 걸기/).fill('<img src=x onerror=alert(1)> <script>alert(2)</script> **<b>굵게</b>**');
    await page.getByRole("button", { name: "보내기" }).click();
    await expect(page.getByText(/가 답하는 중/)).toBeHidden();

    const log = page.getByRole("log");
    await expect(log.getByText("<img src=x onerror=alert(1)>", { exact: false })).toBeVisible();
    await expect(log.locator("img[src='x'], script")).toHaveCount(0);
    expect(dialog).toBe(false);
  });
});
