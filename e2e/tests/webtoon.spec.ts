import { expect, test } from "@playwright/test";
import { OFFICIAL_ID, api, chat, createPersona, signedInPage, signup, type User } from "../helpers";

// 웹툰 (오퍼레이션). e2e는 가짜 LLM(콘티 6컷 고정 → 필요한 만큼 자름)과 가짜 그림 엔진
const CHAT = `/characters/${OFFICIAL_ID}/chat`;
const OPS = `${CHAT}/ops/webtoon`;

type Panel = { index: number; caption: string; lines: { speaker: string; text: string }[]; drawn: boolean };
type Webtoon = { id: string; title: string; rating: string; panels: Panel[] };
type View = { cost: number; ready: boolean; minPanels: number; maxPanels: number; nsfw: { allowed: boolean }; webtoons: Webtoon[]; message?: string };

const balance = async (user: User) => (await api<{ balance: number }>("/me/credits", { token: user.token })).body.balance;

async function talking(tag: string, credits = true) {
  const user = await signup(tag);
  const personaId = await createPersona(user, "민준");
  expect((await chat(user, OFFICIAL_ID, personaId, "안녕하세요 선생님")).status).toBe(200);
  if (credits) await api("/me/attendance", { token: user.token, method: "POST" });
  return user;
}

const make = (user: User, json: Record<string, unknown>) =>
  api<{ webtoon: Webtoon; message?: string }>(OPS, { token: user.token, json: { prompt: "", panels: 3, ...json } });
const draw = (user: User, webtoonId: string, index: number) =>
  api<{ panel: Panel; balance: number; message?: string }>(`${OPS}/${webtoonId}/panels/${index}`, { token: user.token, method: "POST" });

test.describe("오퍼레이션 · 웹툰", () => {
  test("콘티는 무료, 컷은 하나씩 45 코레딧. 이미 그린 컷은 다시 못 그리고, 그림은 그 대화를 하는 사람에게만", async () => {
    const user = await talking("웹툰");
    const view = await api<View>(OPS, { token: user.token });
    expect(view.body).toMatchObject({ cost: 45, ready: true, minPanels: 2, maxPanels: 6, webtoons: [] });

    // 장면 설명을 비우면 최근 대화를 그린다. 콘티만으로는 코레딧이 빠지지 않는다
    const made = await make(user, { panels: 3 });
    expect(made.status).toBe(200);
    const webtoon = made.body.webtoon;
    expect(webtoon.panels).toHaveLength(3);
    expect(webtoon.panels[0]).toMatchObject({ index: 0, caption: "1번째 장면", drawn: false });
    expect(webtoon.panels[1].lines[0]).toEqual({ speaker: "테스트 선생", text: "2번째 대사예요." });
    expect(await balance(user)).toBe(1000);

    const first = await draw(user, webtoon.id, 0);
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ panel: { index: 0, drawn: true }, balance: 955 });
    expect((await draw(user, webtoon.id, 0)).status).toBe(409);
    expect((await draw(user, webtoon.id, 9)).status).toBe(404);
    const ledger = await api<{ history: { delta: number; modelId: string }[] }>("/me/credits", { token: user.token });
    expect(ledger.body.history[0]).toMatchObject({ delta: -45, modelId: "op:webtoon" });

    const picture = await api(`${OPS}/${webtoon.id}/panels/0`, { token: user.token });
    expect(picture.status).toBe(200);
    // 안 그린 컷은 그림이 없다
    expect((await api(`${OPS}/${webtoon.id}/panels/1`, { token: user.token })).status).toBe(404);
    const stranger = await talking("웹툰남");
    expect((await api(`${OPS}/${webtoon.id}/panels/0`, { token: stranger.token })).status).toBe(404);
    expect((await draw(stranger, webtoon.id, 1)).status).toBe(404);

    const listed = await api<View>(OPS, { token: user.token });
    expect(listed.body.webtoons[0].panels.map((p) => p.drawn)).toEqual([true, false, false]);

    // 컷 수는 2~6
    expect((await make(user, { panels: 7 })).status).toBe(400);
    expect((await make(user, { panels: 1 })).status).toBe(400);
  });

  test("코레딧이 모자라면 컷을 그리지 않고(403) 그대로 남아 나중에 그릴 수 있다", async () => {
    const user = await talking("웹툰가난", false);
    const made = await make(user, { panels: 2, prompt: "도서관에서 공부하는 장면" });
    expect(made.status).toBe(200);
    const res = await draw(user, made.body.webtoon.id, 0);
    expect(res.status).toBe(403);
    expect((await api<View>(OPS, { token: user.token })).body.webtoons[0].panels.every((p) => !p.drawn)).toBe(true);
  });

  test("성인 웹툰: 성인 확인 전 403, 미성년자 설정 400, 동의를 거두면 목록·그림에서 사라진다", async () => {
    const user = await talking("웹툰성인");
    expect((await make(user, { rating: "nsfw" })).status).toBe(403);
    expect((await api("/auth/me/adult", { token: user.token, json: { birthDate: "1990-01-01", consent: true } })).status).toBe(200);
    const minor = await make(user, { rating: "nsfw", prompt: "고등학생 둘이 교실에서" });
    expect(minor.status).toBe(400);
    expect(minor.body.message).toContain("미성년자");

    const made = await make(user, { rating: "nsfw", panels: 2 });
    expect(made.status).toBe(200);
    expect(made.body.webtoon.rating).toBe("nsfw");
    expect((await draw(user, made.body.webtoon.id, 0)).status).toBe(200);
    expect((await api(`${OPS}/${made.body.webtoon.id}/panels/0`, { token: user.token })).status).toBe(200);

    expect((await api("/auth/me/adult", { token: user.token, method: "DELETE" })).status).toBe(204);
    expect((await api<View>(OPS, { token: user.token })).body.webtoons).toHaveLength(0);
    expect((await api(`${OPS}/${made.body.webtoon.id}/panels/0`, { token: user.token })).status).toBe(404);
    expect((await draw(user, made.body.webtoon.id, 1)).status).toBe(403);
  });

  test("화면: 오퍼레이션 메뉴 → 웹툰 → 2컷 만들기 → 컷 그림·해설·대사가 차례로 보인다", async ({ browser }) => {
    const user = await talking("웹툰화면");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "오퍼레이션" }).click();
    await page.getByRole("menu", { name: "오퍼레이션" }).getByRole("menuitem", { name: /웹툰/ }).click();
    await expect(page).toHaveURL(`${CHAT}/webtoon`, { timeout: 60_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("웹툰");

    await page.getByLabel("장면 설명").fill("스터디카페에서 같이 공부하는 장면");
    await page.getByLabel("컷 수").selectOption("2");
    await expect(page.getByText("2컷이면 90 코레딧")).toBeVisible();
    await page.getByRole("button", { name: "웹툰 만들기" }).click();

    const webtoon = page.getByRole("list", { name: "만든 웹툰" }).getByRole("article");
    await expect(webtoon.getByRole("img")).toHaveCount(2, { timeout: 60_000 });
    await expect(webtoon).toContainText("1번째 장면");
    await expect(webtoon).toContainText("2번째 대사예요.");
    await expect(page.getByText("910", { exact: true })).toBeVisible();
    // 중계 라우트로 실제 그림이 온다
    const src = await webtoon.getByRole("img").first().getAttribute("src");
    const res = await page.request.get(src!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/webp");
  });
});
