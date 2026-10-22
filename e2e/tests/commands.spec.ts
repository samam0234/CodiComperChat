import { expect, test } from "@playwright/test";
import { OFFICIAL_ID, api, chat, createPersona, signedInPage, signup } from "../helpers";

const CHAT = `/characters/${OFFICIAL_ID}/chat`;
type History = { messages: { role: "user" | "character"; text: string }[] };

const history = async (token: string) => (await api<History>(CHAT, { token })).body.messages;

test.describe("대화 명령어", () => {
  test("서버: /다시는 마지막 답을 바꾸고, /계속은 답만 하나 더, /되돌리기는 마지막 내 말부터 지운다", async () => {
    const user = await signup("명령서버");
    const personaId = await createPersona(user);

    // 대화 전에는 다시 쓸 것도, 되돌릴 것도 없다
    expect((await api(`${CHAT}/regenerate`, { token: user.token, json: { personaId } })).status).toBe(409);
    expect((await api(`${CHAT}/undo`, { token: user.token, method: "POST" })).status).toBe(409);

    await chat(user, OFFICIAL_ID, personaId, "첫 말");
    await chat(user, OFFICIAL_ID, personaId, "둘째 말");
    const before = await history(user.token);

    const regen = await api<{ reply: string; model: string }>(`${CHAT}/regenerate`, { token: user.token, json: { personaId } });
    expect(regen.status).toBe(200);
    expect(regen.body.model).toBe("basic");
    const afterRegen = await history(user.token);
    expect(afterRegen).toHaveLength(before.length);
    expect(afterRegen.at(-2)).toMatchObject({ role: "user", text: "둘째 말" });

    const cont = await api(`${CHAT}/continue`, { token: user.token, json: { personaId } });
    expect(cont.status).toBe(200);
    const afterContinue = await history(user.token);
    expect(afterContinue).toHaveLength(before.length + 1);
    expect(afterContinue.slice(-2).map((m) => m.role)).toEqual(["character", "character"]);

    // 되돌리기: "둘째 말"과 그 뒤 답 두 개가 함께 지워진다
    const undo = await api<{ removed: number } & History>(`${CHAT}/undo`, { token: user.token, method: "POST" });
    expect(undo.body.removed).toBe(3);
    expect(undo.body.messages.at(-2)).toMatchObject({ role: "user", text: "첫 말" });
    expect(await history(user.token)).toHaveLength(before.length - 2);
  });

  test("화면: /도움말·/상황·/계속·/되돌리기, 모르는 명령어는 안내", async ({ browser }) => {
    const user = await signup("명령화면");
    await createPersona(user, "민준");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");
    await page.locator("#persona-select").selectOption({ label: "민준" });
    const input = page.getByPlaceholder(/에게 말 걸기/);
    const enter = async (text: string) => {
      await input.fill(text);
      await page.getByRole("button", { name: "보내기" }).click();
      await expect(page.getByText(/가 답하는 중/)).toBeHidden();
    };

    await enter("/도움말");
    await expect(page.getByRole("status").filter({ hasText: "/되돌리기" })).toBeVisible();

    // /상황은 괄호 속 장면 지시로 보낸다
    await enter("/상황 갑자기 비가 쏟아진다");
    await expect(page.getByText("(갑자기 비가 쏟아진다)")).toBeVisible();
    const log = page.getByRole("log");
    const replies = log.getByText("네, 알겠어요. 오늘도 천천히 이야기해 봐요.");
    await expect(replies).toHaveCount(1);

    await enter("/계속");
    await expect(replies).toHaveCount(2);

    await enter("/되돌리기");
    await expect(page.getByText("마지막 내 말과 답을 되돌렸어요.")).toBeVisible();
    await expect(page.getByText("(갑자기 비가 쏟아진다)")).toHaveCount(0);
    await expect(replies).toHaveCount(0);

    await enter("/아무거나");
    await expect(page.getByRole("alert").filter({ hasText: "알 수 없는 명령어예요: /아무거나" })).toBeVisible();
  });
});
