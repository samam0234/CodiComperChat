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
    // 개발 서버가 /mind를 처음 컴파일할 때 전체 시험 부하에서 15초를 넘길 수 있다
    await expect(page).toHaveURL(`${CHAT}/mind`, { timeout: 60_000 });
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

test.describe("코디포토넷 (그림 엔진: e2e는 가짜 엔진)", () => {
  type Image = { id: string; prompt: string; style: string; ratio: string; width: number; height: number };

  test("만들기: 50 코레딧, 화풍·비율에 맞는 크기, 그림은 그 대화를 하는 사람에게만", async () => {
    const { user } = await talking("포토넷");
    const view = await api<{ ready: boolean; cost: number; styles: string[]; images: Image[] }>(`${OPS}/photonet`, { token: user.token });
    expect(view.body).toMatchObject({ ready: true, cost: 50, images: [] });
    expect(view.body.styles).toEqual(["애니메이션", "웹툰", "수채화", "실사풍"]);

    const made = await api<{ image: Image; balance: number; cast: string[] }>(`${OPS}/photonet`, {
      token: user.token,
      json: { prompt: "비 오는 카페 창가", style: "수채화", ratio: "세로" },
    });
    expect(made.status).toBe(200);
    // 수채화는 SD 1.5 계열이라 세로 512×768
    expect(made.body.image).toMatchObject({ prompt: "비 오는 카페 창가", style: "수채화", ratio: "세로", width: 512, height: 768 });
    expect(made.body.balance).toBe(950);
    // 그림에 넣은 사람을 함께 돌려준다 (가짜 설계표: 캐릭터와 주인공)
    expect(made.body.cast).toEqual(["테스트 선생(남)", "민준(남)"]);

    const anime = await api<{ image: Image }>(`${OPS}/photonet`, {
      token: user.token,
      json: { prompt: "웃는 얼굴", style: "애니메이션", ratio: "가로" },
    });
    // 애니메이션은 SDXL(Animagine XL) 계열이라 가로 1216×832
    expect(anime.body.image).toMatchObject({ width: 1216, height: 832 });

    const picture = await api<Buffer>(`${OPS}/photonet/${made.body.image.id}`, { token: user.token });
    expect(picture.status).toBe(200);
    expect(Buffer.isBuffer(picture.body) && picture.body.subarray(8, 12).toString()).toBe("WEBP");

    const stranger = await signup("포토넷남");
    expect((await api(`${OPS}/photonet/${made.body.image.id}`, { token: stranger.token })).status).toBe(404);

    const ledger = await api<{ history: { reason: string; delta: number; modelId: string | null }[] }>("/me/credits", { token: user.token });
    expect(ledger.body.history[0]).toMatchObject({ reason: "OPERATION", delta: -50, modelId: "op:photonet" });

    expect((await api(`${OPS}/photonet`, { token: user.token, json: { prompt: "", style: "수채화", ratio: "세로" } })).status).toBe(400);
    expect((await api(`${OPS}/photonet`, { token: user.token, json: { prompt: "", style: "수채화", ratio: "세로", messageId: "nope" } })).status).toBe(400);
    expect((await api(`${OPS}/photonet`, { token: user.token, json: { prompt: "x", style: "유화", ratio: "세로" } })).status).toBe(400);
    const listed = await api<{ images: Image[] }>(`${OPS}/photonet`, { token: user.token });
    expect(listed.body.images.map((i) => i.style)).toEqual(["애니메이션", "수채화"]);
  });

  test("대사를 골라 그리면 장면 설명 없이도 되고, 남의 대화 대사는 고를 수 없다", async () => {
    const { user } = await talking("포토넷대사");
    const history = await api<{ messages: { id: string; role: string; text: string }[] }>(CHAT, { token: user.token });
    const line = history.body.messages.find((m) => m.role === "user")!;
    const made = await api<{ image: Image; cast: string[] }>(`${OPS}/photonet`, {
      token: user.token,
      json: { prompt: "", style: "웹툰", ratio: "정사각", messageId: line.id },
    });
    expect(made.status).toBe(200);
    // 장면 설명이 없으면 고른 대사를 남긴다
    expect(made.body.image.prompt).toBe(line.text);
    expect(made.body.image).toMatchObject({ width: 1024, height: 1024 });

    const other = await talking("포토넷대사남");
    expect((await api(`${OPS}/photonet`, { token: other.user.token, json: { prompt: "", style: "웹툰", ratio: "정사각", messageId: line.id } })).status).toBe(400);
  });

  test("코레딧이 모자라면 403이고 그림이 남지 않는다", async () => {
    const { user } = await talking("포토넷가난", false);
    const res = await api<{ message: string }>(`${OPS}/photonet`, { token: user.token, json: { prompt: "카페", style: "웹툰", ratio: "정사각" } });
    expect(res.status).toBe(403);
    expect((await api<{ images: unknown[] }>(`${OPS}/photonet`, { token: user.token })).body.images).toHaveLength(0);
  });

  test("화면: 입력창 위 왼쪽 버튼 → 지금 장면으로 채우기 → 만들기 → 갤러리에 그림, Esc로 닫기", async ({ browser }) => {
    const { user } = await talking("포토넷화면");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "코디포토넷" }).click();
    const dialog = page.getByRole("dialog", { name: "코디포토넷" });
    await expect(dialog).toContainText("50 코레딧");
    await expect(dialog.getByText("준비 중")).toHaveCount(0);

    await dialog.getByRole("button", { name: "지금 장면으로 채우기" }).click();
    await expect(dialog.getByLabel("장면 설명")).toHaveValue("네, 알겠어요. 오늘도 천천히 이야기해 봐요.");
    await dialog.getByText("수채화").click();
    // 그릴 장면: 최근 대사 중 내 말을 고른다
    const pick = dialog.getByLabel("그릴 장면");
    // 기본(최근 대화) + 저장된 대사 3개(시작 장면·내 말·답)
    await expect(pick.locator("option")).toHaveCount(4);
    await pick.selectOption({ label: "민준: 안녕하세요 선생님" });
    await dialog.getByRole("button", { name: "만들기" }).click();
    await expect(dialog.getByText("그림을 만들었어요. 등장: 테스트 선생(남) · 민준(남)")).toBeVisible();
    const gallery = dialog.getByRole("region", { name: "만든 그림" });
    await expect(gallery.getByRole("img")).toHaveCount(1);
    await expect(gallery).toContainText("수채화");
    // 중계 라우트로 실제 그림이 온다
    const src = await gallery.getByRole("img").getAttribute("src");
    const res = await page.request.get(src!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/webp");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

test.describe("코디포토넷 수위 (전체 이용가 · 성인)", () => {
  type Image = { id: string; rating: string; style: string };
  type View = { images: Image[]; nsfw: { allowed: boolean; reason: string | null; blockedStyles: string[] } };
  const adult = (user: User, birthDate: string, consent = true) =>
    api<{ message?: string; adult?: boolean }>("/auth/me/adult", { token: user.token, json: { birthDate, consent } });
  const make = (user: User, json: Record<string, unknown>) =>
    api<{ image: Image; message?: string }>(`${OPS}/photonet`, { token: user.token, json: { prompt: "카페", ratio: "정사각", ...json } });

  test("성인 확인: 이메일 인증·만 19세·동의가 모두 있어야 하고, 생년월일은 한 번 넣으면 못 바꾼다", async () => {
    const unverified = await signup("성인미인증", { verified: false });
    expect((await adult(unverified, "1990-01-01")).status).toBe(403);

    const minor = await signup("성인미성년");
    const young = new Date().getFullYear() - 15;
    const blocked = await adult(minor, `${young}-01-01`);
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toContain("만 19세");
    // 날짜만 고쳐 다시 해도 처음 넣은 생년월일로 본다
    expect((await adult(minor, "1990-01-01")).status).toBe(403);

    const grown = await signup("성인확인");
    expect((await adult(grown, "1990-01-01", false)).status).toBe(400);
    expect((await adult(grown, "1990-02-30")).status).toBe(400);
    expect((await adult(grown, "1990-01-01")).status).toBe(200);
    const me = await api<Record<string, unknown>>("/auth/me", { token: grown.token });
    expect(me.body.adult).toBe(true);
    // 생년월일·동의 시각은 응답에 싣지 않는다
    expect(me.body).not.toHaveProperty("birthDate");
    expect(me.body).not.toHaveProperty("adultConsentAt");
    expect((await api(`/auth/me/adult`, { token: grown.token, method: "DELETE" })).status).toBe(204);
    expect((await api<Record<string, unknown>>("/auth/me", { token: grown.token })).body.adult).toBe(false);
  });

  test("성인 모드: 확인 전에는 403, 실사풍은 400, 동의를 거두면 성인 그림이 목록·본문 모두에서 사라진다", async () => {
    const { user } = await talking("포토넷성인");
    const before = await api<View>(`${OPS}/photonet`, { token: user.token });
    expect(before.body.nsfw).toMatchObject({ allowed: false, reason: "NO_BIRTHDATE", blockedStyles: ["실사풍"] });
    expect((await make(user, { style: "애니메이션", rating: "nsfw" })).status).toBe(403);
    expect((await make(user, { style: "애니메이션", rating: "mature" })).status).toBe(400);
    expect(await balance(user)).toBe(1000);

    expect((await adult(user, "1995-06-15")).status).toBe(200);
    expect((await api<View>(`${OPS}/photonet`, { token: user.token })).body.nsfw.allowed).toBe(true);
    expect((await make(user, { style: "실사풍", rating: "nsfw" })).status).toBe(400);
    const sfw = await make(user, { style: "웹툰" });
    expect(sfw.status).toBe(200);
    expect(sfw.body.image.rating).toBe("sfw");
    const nsfw = await make(user, { style: "애니메이션", rating: "nsfw" });
    expect(nsfw.status).toBe(200);
    expect(nsfw.body.image.rating).toBe("nsfw");
    expect((await api<View>(`${OPS}/photonet`, { token: user.token })).body.images.map((i) => i.rating)).toEqual(["nsfw", "sfw"]);
    expect((await api(`${OPS}/photonet/${nsfw.body.image.id}`, { token: user.token })).status).toBe(200);

    expect((await api(`/auth/me/adult`, { token: user.token, method: "DELETE" })).status).toBe(204);
    const after = await api<View>(`${OPS}/photonet`, { token: user.token });
    expect(after.body.nsfw.allowed).toBe(false);
    expect(after.body.images.map((i) => i.rating)).toEqual(["sfw"]);
    expect((await api(`${OPS}/photonet/${nsfw.body.image.id}`, { token: user.token })).status).toBe(404);
    expect((await api(`${OPS}/photonet/${sfw.body.image.id}`, { token: user.token })).status).toBe(200);
    expect((await make(user, { style: "애니메이션", rating: "nsfw" })).status).toBe(403);
  });

  test("화면: 성인 버튼 → 열림 상자에서 성인 확인 → 곧바로 성인 모드(실사풍 잠김) → 19 그림은 성인 모드에서만", async ({ browser }) => {
    const { user } = await talking("포토넷성인화면");
    const page = await signedInPage(await browser.newContext(), user);
    await page.goto(CHAT);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "코디포토넷" }).click();
    let dialog = page.getByRole("dialog", { name: "코디포토넷" });
    await expect(dialog.getByRole("button", { name: "전체 이용가" })).toHaveAttribute("aria-pressed", "true");
    await dialog.getByText("실사풍").click();
    // 확인 전에 성인 버튼을 누르면 설정 페이지로 가지 않고 열림 상자가 뜬다
    await dialog.getByRole("button", { name: "성인", exact: true }).click();
    const confirm = page.getByRole("dialog", { name: "성인 확인" });
    await expect(confirm).toBeVisible();
    // 취소하면 전체 이용가 그대로
    await confirm.getByRole("button", { name: "취소" }).click();
    await expect(confirm).toBeHidden();
    await expect(dialog.getByRole("button", { name: "전체 이용가" })).toHaveAttribute("aria-pressed", "true");
    await dialog.getByRole("button", { name: "성인", exact: true }).click();
    await confirm.getByLabel("생년월일").fill("1992-03-04");
    await confirm.getByRole("button", { name: "성인 확인", exact: true }).click();
    // 동의를 안 하면 보내지 않는다(필수 체크)
    await expect(confirm).toBeVisible();
    await confirm.getByLabel(/만 19세 이상이며/).check();
    await confirm.getByRole("button", { name: "성인 확인", exact: true }).click();
    await expect(confirm).toBeHidden();
    // 확인이 끝나면 곧바로 성인 모드
    await expect(dialog.getByRole("note")).toContainText("성인 모드");
    // 실사풍을 골라 두었으면 애니메이션으로 바뀌고, 실사풍은 잠긴다
    await expect(dialog.getByRole("radio", { name: "애니메이션" })).toBeChecked();
    await expect(dialog.getByRole("radio", { name: "실사풍" })).toBeDisabled();
    await dialog.getByLabel("장면 설명").fill("둘이 밤늦게 이야기하는 장면");
    await dialog.getByRole("button", { name: "만들기" }).click();
    await expect(dialog.getByText(/그림을 만들었어요/)).toBeVisible();
    const adultGallery = dialog.getByRole("region", { name: "만든 성인 그림" });
    await expect(adultGallery.getByRole("img")).toHaveCount(1);
    await expect(adultGallery.getByLabel("성인")).toHaveCount(1);

    // 전체 이용가로 돌아가면 성인 그림은 보이지 않는다
    await dialog.getByRole("button", { name: "전체 이용가" }).click();
    await expect(dialog.getByRole("region", { name: "만든 그림" }).getByRole("img")).toHaveCount(0);
    // 창을 다시 열면 언제나 전체 이용가부터
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "코디포토넷" }).click();
    await expect(dialog.getByRole("button", { name: "전체 이용가" })).toHaveAttribute("aria-pressed", "true");
  });
});
