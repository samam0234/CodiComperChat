import { expect, test } from "@playwright/test";
import { OFFICIAL_ID, api, chat, createPersona, signedInPage, signup, type User } from "../helpers";

const CHAT = `/characters/${OFFICIAL_ID}/chat`;
const OPS = `${CHAT}/ops`;

const attend = (user: User) => api("/me/attendance", { token: user.token, method: "POST" });
const balance = async (user: User) => (await api<{ balance: number }>("/me/credits", { token: user.token })).body.balance;

// 대화를 하나 시작해 둔 계정 (오퍼레이션은 진행 중인 대화가 있어야 한다)
async function talking(tag: string, credits = true) {
  const user = await signup(tag);
  const personaId = await createPersona(user, "민준");
  expect((await chat(user, OFFICIAL_ID, personaId, "안녕하세요 선생님")).status).toBe(200);
  if (credits) await attend(user);
  return { user, personaId };
}

test.describe("오퍼레이션 · 심리 탐구", () => {
  test("대화 전에는 못 쓰고(코레딧도 그대로), 대화 중에는 30 코레딧으로 속마음을 엿본다", async () => {
    const fresh = await signup("심리전");
    await attend(fresh);
    const before = await api<{ started: boolean; cost: number }>(`${OPS}/mind`, { token: fresh.token });
    expect(before.body).toMatchObject({ started: false, cost: 30 });
    const blocked = await api<{ message: string }>(`${OPS}/mind`, { token: fresh.token, method: "POST" });
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toContain("먼저");
    expect(await balance(fresh)).toBe(1000);

    const { user } = await talking("심리중");
    const read = await api<{ reading: { innerVoice: string; feeling: string; aboutUser: string }; balance: number }>(`${OPS}/mind`, {
      token: user.token,
      method: "POST",
    });
    expect(read.status).toBe(200);
    expect(read.body.reading.feeling).toBe("설렘");
    expect(read.body.reading.innerVoice.length).toBeGreaterThan(0);
    expect(read.body.balance).toBe(970);

    const view = await api<{ started: boolean; readings: unknown[]; balance: number }>(`${OPS}/mind`, { token: user.token });
    expect(view.body).toMatchObject({ started: true, balance: 970 });
    expect(view.body.readings).toHaveLength(1);

    const ledger = await api<{ history: { reason: string; delta: number; modelId: string | null }[] }>("/me/credits", { token: user.token });
    expect(ledger.body.history[0]).toMatchObject({ reason: "OPERATION", delta: -30, modelId: "op:mind" });
  });

  test("코레딧이 모자라면 403", async () => {
    const { user } = await talking("심리가난", false);
    const res = await api<{ message: string }>(`${OPS}/mind`, { token: user.token, method: "POST" });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain("코레딧");
  });

  test("화면: 입력창 위 오퍼레이션 메뉴 → 심리 탐구 → 속마음 엿보기", async ({ browser }) => {
    const { user } = await talking("심리화면");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "오퍼레이션" }).click();
    const menu = page.getByRole("menu", { name: "오퍼레이션" });
    await menu.getByRole("menuitem", { name: /심리 탐구/ }).click();
    await expect(page).toHaveURL(`${CHAT}/mind`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("머릿속");

    await page.getByRole("button", { name: /속마음 엿보기/ }).click();
    const list = page.getByRole("list", { name: "엿본 속마음" });
    await expect(list.getByText("설렘")).toBeVisible();
    await expect(list).toContainText("오늘따라 믿음직해 보인다.");
    await expect(page.getByText("970", { exact: true })).toBeVisible();
  });
});

test.describe("오퍼레이션 · 일기", () => {
  test("캐릭터가 쓴 일기: 20 코레딧, 최근 것부터 쌓인다", async () => {
    const { user } = await talking("일기중");
    const first = await api<{ entry: { title: string; mood: string; body: string }; balance: number }>(`${OPS}/diary`, {
      token: user.token,
      method: "POST",
    });
    expect(first.status).toBe(200);
    expect(first.body.entry).toMatchObject({ title: "비 오는 날의 손님", mood: "포근함" });
    expect(first.body.balance).toBe(980);
    await api(`${OPS}/diary`, { token: user.token, method: "POST" });
    const view = await api<{ entries: unknown[]; balance: number; cost: number }>(`${OPS}/diary`, { token: user.token });
    expect(view.body).toMatchObject({ balance: 960, cost: 20 });
    expect(view.body.entries).toHaveLength(2);
  });

  test("화면: 메뉴 → 일기 → 일기 쓰게 하기", async ({ browser }) => {
    const { user } = await talking("일기화면");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "오퍼레이션" }).click();
    await page.getByRole("menu", { name: "오퍼레이션" }).getByRole("menuitem", { name: /일기/ }).click();
    await expect(page).toHaveURL(`${CHAT}/diary`);
    await page.getByRole("button", { name: /일기 쓰게 하기/ }).click();
    const list = page.getByRole("list", { name: "일기" });
    await expect(list.getByRole("heading", { name: "비 오는 날의 손님" })).toBeVisible();
    await expect(list).toContainText("포근함");
  });
});

test.describe("오퍼레이션 · 메시지", () => {
  test("문자는 대화와 따로 쌓이고 코레딧이 들지 않는다", async () => {
    const { user } = await talking("문자중", false);
    const res = await api<{ sent: { role: string; text: string }; reply: { role: string; text: string } }>(`${OPS}/messages`, {
      token: user.token,
      json: { text: "지금 뭐 해요?" },
    });
    expect(res.status).toBe(200);
    expect(res.body.sent).toMatchObject({ role: "user", text: "지금 뭐 해요?" });
    expect(res.body.reply.role).toBe("character");
    expect(await balance(user)).toBe(0);

    const view = await api<{ messages: { role: string; text: string }[] }>(`${OPS}/messages`, { token: user.token });
    expect(view.body.messages.map((m) => m.role)).toEqual(["user", "character"]);
    // 대화(롤플레이) 기록에는 섞이지 않는다
    const chatLog = await api<{ messages: { text: string }[] }>(CHAT, { token: user.token });
    expect(chatLog.body.messages.some((m) => m.text === "지금 뭐 해요?")).toBe(false);

    expect((await api(`${OPS}/messages`, { token: user.token, json: { text: "   " } })).status).toBe(400);
    expect((await api(`${OPS}/messages`, { token: user.token, json: { text: "가".repeat(501) } })).status).toBe(400);
    const fresh = await signup("문자전");
    expect((await api(`${OPS}/messages`, { token: fresh.token, json: { text: "안녕" } })).status).toBe(409);
  });

  test("화면: 메뉴 → 메시지 → 문자 보내고 답장 받기", async ({ browser }) => {
    const { user } = await talking("문자화면", false);
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "오퍼레이션" }).click();
    await page.getByRole("menu", { name: "오퍼레이션" }).getByRole("menuitem", { name: /메시지/ }).click();
    await expect(page).toHaveURL(`${CHAT}/messages`);

    await page.getByLabel("보낼 문자").fill("오늘 날씨 좋네요");
    await page.getByRole("button", { name: "보내기" }).click();
    const log = page.getByRole("log", { name: /주고받은 문자/ });
    await expect(log.getByText("오늘 날씨 좋네요")).toBeVisible();
    await expect(log.getByText("네, 알겠어요. 오늘도 천천히 이야기해 봐요.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("log", { name: /주고받은 문자/ }).getByText("오늘 날씨 좋네요")).toBeVisible();
  });
});

test.describe("오퍼레이션 · 커뮤니티", () => {
  type Post = { authorKind: string; authorName: string; title: string; comments: { authorName: string }[] };

  test("새 글 불러오기(20)·내 글 쓰기(10, 익명 기본·실명 선택), 글 검사", async () => {
    const { user } = await talking("게시판중");
    const refreshed = await api<{ posts: Post[]; balance: number }>(`${OPS}/board/refresh`, { token: user.token, method: "POST" });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.posts).toHaveLength(3);
    expect(refreshed.body.posts[0]).toMatchObject({ authorKind: "RESIDENT", title: "카페 사장님 오늘도 친절하심" });
    expect(refreshed.body.posts[0].comments).toHaveLength(1);
    expect(refreshed.body.balance).toBe(980);

    const anon = await api<{ post: Post; balance: number }>(`${OPS}/board/posts`, {
      token: user.token,
      json: { title: "오늘 카페 다녀옴", body: "사장님이 친절했어요" },
    });
    expect(anon.status).toBe(200);
    expect(anon.body.post).toMatchObject({ authorKind: "USER", authorName: "익명" });
    expect(anon.body.post.comments.length).toBeGreaterThanOrEqual(2);
    expect(anon.body.balance).toBe(970);

    const named = await api<{ post: Post }>(`${OPS}/board/posts`, {
      token: user.token,
      json: { title: "실명 글", body: "안녕하세요", anonymous: false },
    });
    expect(named.body.post.authorName).toBe("민준");

    const view = await api<{ posts: Post[]; persona: string; cost: number; postCost: number }>(`${OPS}/board`, { token: user.token });
    expect(view.body).toMatchObject({ persona: "민준", cost: 20, postCost: 10 });
    expect(view.body.posts).toHaveLength(5);
    expect(view.body.posts[0].title).toBe("실명 글");

    expect((await api(`${OPS}/board/posts`, { token: user.token, json: { title: "", body: "x" } })).status).toBe(400);
    expect((await api(`${OPS}/board/posts`, { token: user.token, json: { title: "가".repeat(61), body: "x" } })).status).toBe(400);
  });

  test("게시판은 대화마다 따로이고 다른 유저에게 보이지 않는다", async () => {
    const a = await talking("게시판A");
    const b = await talking("게시판B");
    await api(`${OPS}/board/refresh`, { token: a.user.token, method: "POST" });
    const other = await api<{ posts: unknown[] }>(`${OPS}/board`, { token: b.user.token });
    expect(other.body.posts).toHaveLength(0);
  });

  test("화면: 메뉴 → 커뮤니티 → 새 글 불러오기 → 실명으로 글쓰기", async ({ browser }) => {
    const { user } = await talking("게시판화면");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "오퍼레이션" }).click();
    await page.getByRole("menu", { name: "오퍼레이션" }).getByRole("menuitem", { name: /커뮤니티/ }).click();
    await expect(page).toHaveURL(`${CHAT}/community`);

    await page.getByRole("button", { name: /새 글 불러오기/ }).click();
    const list = page.getByRole("list", { name: "게시판 글" });
    await expect(list.getByRole("heading", { name: "우산 잃어버리신 분" })).toBeVisible();

    await page.getByRole("button", { name: "글쓰기" }).click();
    const write = page.getByRole("form", { name: "게시판 글쓰기" });
    await write.getByRole("radio", { name: /실명/ }).check();
    await write.getByLabel("제목").fill("민준입니다");
    await write.getByLabel("내용").fill("카페 단골이에요");
    await write.getByRole("button", { name: /올리기/ }).click();
    const mine = list.getByRole("listitem").filter({ hasText: "민준입니다" }).first();
    await expect(mine).toContainText("나");
    await expect(mine.getByRole("list", { name: /댓글/ })).toContainText("좋은 글이네요");
  });
});

test.describe("코디포토넷 (엔진 준비 중)", () => {
  test("상태는 준비 중, 만들기는 503이고 코레딧이 그대로다. 입력 검사는 먼저 한다", async () => {
    const { user } = await talking("포토넷");
    const view = await api<{ ready: boolean; cost: number; styles: string[]; ratios: string[]; images: unknown[] }>(`${OPS}/photonet`, {
      token: user.token,
    });
    expect(view.body).toMatchObject({ ready: false, cost: 50, images: [] });
    expect(view.body.styles).toContain("애니메이션");

    const made = await api<{ message: string }>(`${OPS}/photonet`, {
      token: user.token,
      json: { prompt: "비 오는 카페", style: "수채화", ratio: "세로" },
    });
    expect(made.status).toBe(503);
    expect(made.body.message).toContain("준비 중");
    expect(await balance(user)).toBe(1000);

    expect((await api(`${OPS}/photonet`, { token: user.token, json: { prompt: "", style: "수채화", ratio: "세로" } })).status).toBe(400);
    expect((await api(`${OPS}/photonet`, { token: user.token, json: { prompt: "x", style: "유화", ratio: "세로" } })).status).toBe(400);
  });

  test("화면: 입력창 위 왼쪽 버튼 → 창(준비 중, 만들기 잠김), 지금 장면으로 채우기, Esc로 닫기", async ({ browser }) => {
    const { user } = await talking("포토넷화면");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "코디포토넷" }).click();
    const dialog = page.getByRole("dialog", { name: "코디포토넷" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("status")).toContainText("준비 중");
    await expect(dialog).toContainText("50 코레딧");
    await expect(dialog.getByRole("button", { name: "준비 중" })).toBeDisabled();

    await dialog.getByRole("button", { name: "지금 장면으로 채우기" }).click();
    await expect(dialog.getByLabel("장면 설명")).toHaveValue("네, 알겠어요. 오늘도 천천히 이야기해 봐요.");
    await dialog.getByText("수채화").click();
    await expect(dialog.getByRole("radio", { name: "수채화" })).toBeChecked();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
