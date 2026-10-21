import { expect, test } from "@playwright/test";
import { OFFICIAL_ID, api, chat, createPersona, publishedCharacter, signup, uniq } from "../helpers";

type Popular = { id: string; name: string; official: boolean; rank: number; stats: { players: number; messages7d: number } }[];

test.describe("인기", () => {
  test("순위: 대화한 사람 수 → 최근 7일 말 수. 비공개·링크 공개는 빠진다", async () => {
    const owner = await signup("인기주인");
    const hot = await publishedCharacter(owner, uniq("인기많음"), "PUBLIC");
    const cold = await publishedCharacter(owner, uniq("인기적음"), "PUBLIC");
    const hidden = await publishedCharacter(owner, uniq("인기비공개"), "UNLISTED");

    // 두 사람이 hot과 대화 (말 3마디), cold는 아무도 없음
    for (const [tag, turns] of [["인기손님1", 2], ["인기손님2", 1]] as const) {
      const guest = await signup(tag);
      const persona = await createPersona(guest);
      for (let i = 0; i < turns; i++) expect((await chat(guest, hot.characterId, persona, `안녕 ${i}`)).status).toBe(200);
    }

    const { body } = await api<Popular>("/characters/popular");
    const byId = new Map(body.map((c) => [c.id, c]));
    expect(byId.get(hot.characterId)?.stats).toEqual({ players: 2, messages7d: 3 });
    expect(byId.get(cold.characterId)?.stats).toEqual({ players: 0, messages7d: 0 });
    expect(byId.get(hot.characterId)!.rank).toBeLessThan(byId.get(cold.characterId)!.rank);
    expect(byId.has(hidden.characterId)).toBe(false);
    // 순위는 1부터 빈틈없이
    expect(body.map((c) => c.rank)).toEqual(body.map((_, i) => i + 1));
    expect(byId.get(OFFICIAL_ID)?.official).toBe(true);
  });

  test("화면: 요약 숫자·TOP 3·전체 순위, 종류 탭으로 공식/유저 제작만 본다", async ({ page }) => {
    const owner = await signup("인기화면");
    const mine = await publishedCharacter(owner, uniq("인기화면캐릭"), "PUBLIC");
    const { body } = await api<Popular>("/characters/popular");
    const official = body.find((c) => c.id === OFFICIAL_ID)!;
    const myName = body.find((c) => c.id === mine.characterId)!.name;

    await page.goto("/popular");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("이야기 나누는");
    await expect(page.getByRole("heading", { name: /^TOP \d$/ })).toBeVisible();
    // 1위 메달
    await expect(page.getByLabel("1위").first()).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(official.name) }).first()).toBeVisible();

    const tabs = page.getByRole("navigation", { name: "캐릭터 종류" });
    await expect(tabs.getByRole("link", { name: "전체" })).toHaveAttribute("aria-current", "page");

    await tabs.getByRole("link", { name: "유저 제작" }).click();
    await expect(page).toHaveURL(/kind=user/);
    await expect(tabs.getByRole("link", { name: "유저 제작" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: new RegExp(myName) })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(official.name) })).toHaveCount(0);

    await tabs.getByRole("link", { name: "공식" }).click();
    await expect(page.getByRole("link", { name: new RegExp(official.name) }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(myName) })).toHaveCount(0);

    // 이상한 값은 전체로
    await page.goto("/popular?kind=<script>");
    await expect(tabs.getByRole("link", { name: "전체" })).toHaveAttribute("aria-current", "page");
  });
});
