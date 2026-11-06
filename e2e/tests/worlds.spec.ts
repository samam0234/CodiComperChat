import { expect, test } from "@playwright/test";
import { URLS } from "../env.mjs";
import { api, consolePage, createPersona, makeAdmin, signedInPage, signup, sql, uniq, type User } from "../helpers";

// 월드코퍼챗 (2026-11-06). 가짜 LLM: 진행자 답은 고정 한 줄, 파트 판정은 유저 말에 [파트완료]가 있으면 통과.
// 가짜 그림 검수: 그림 바이트에 E2E-REVIEW가 있으면 운영자 검수 대기, E2E-BLOCK이면 거절
const PNG = (marker = "") => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64), Buffer.from(marker)]);

type Edit = { id: string; published: boolean; problems: string[]; images: { id: string; label: string; review: string }[]; cast: { name: string }[] };
type State = {
  world: { id: string; partTitles: string[]; hasMap: boolean };
  rewardedToday?: number;
  dailyRewardCap: number;
  play: null | {
    partIndex: number;
    finished: boolean;
    locations: Record<string, string>;
    messages: { role: string; content: string; segments: { kind: string; speaker: string | null }[] | null }[];
    event: null | { id: string; kind: string; view: Record<string, unknown> };
  };
};

const DOC = {
  title: "별빛 항구",
  oneLiner: "등대 불빛 아래의 밀수 이야기",
  setting: "증기선과 범선이 함께 오가는 항구 도시 세레나. 밤이면 등대 불빛이 바다를 가른다.",
  rules: "마법은 없다",
  opening: '@: 자정 무렵, 불을 끈 배 한 척이 부두에 닿는다.\n한서린: "저 배는 기록에 없어요."',
  mode: "CHAT",
  places: [
    { name: "부두", x: 20, y: 80, note: "배가 닿는 곳" },
    { name: "등대", x: 85, y: 15, note: "" },
  ],
  cast: [
    { name: "한서린", summary: "항구 관리소 직원", speech: "존댓말", startPlace: "부두", homePlace: "등대" },
    { name: "도윤", summary: "등대지기", speech: "반말", startPlace: "등대", homePlace: "" },
  ],
  parts: [
    { title: "낯선 배", goal: "주인공이 배의 정체에 대한 단서를 얻는다", opening: "" },
    { title: "등대의 밤", goal: "주인공이 도윤을 만난다", opening: "등대로 가는 길에 바람이 거세진다." },
  ],
};

async function makeWorld(owner: User, doc: Record<string, unknown> = DOC, visibility = "PUBLIC") {
  const { body } = await api<{ id: string }>("/worlds", { token: owner.token, method: "POST" });
  const saved = await api<Edit>(`/worlds/${body.id}`, { token: owner.token, method: "PUT", json: { world: doc } });
  expect(saved.status).toBe(200);
  const published = await api<Edit>(`/worlds/${body.id}/publish`, { token: owner.token, json: { visibility } });
  expect(published.status).toBe(200);
  return body.id;
}

async function startPlay(player: User, worldId: string) {
  const personaId = await createPersona(player, "이안");
  const started = await api<State>(`/worlds/${worldId}/play`, { token: player.token, json: { personaId } });
  expect(started.status).toBe(200);
  return started.body;
}
const turn = (player: User, worldId: string, text: string) => api<State>(`/worlds/${worldId}/play/turn`, { token: player.token, json: { text } });
const setSettings = (admin: User, json: Record<string, unknown>) => api("/admin/world-settings", { token: admin.token, method: "PUT", json });
// 종류에 맞는 입력 (미로는 빈 이동 = 출구에 못 닿아 패배)
const inputFor = (kind: string) => ({ LADDER: { choice: 0 }, LOTTERY: { choice: 0 }, DICE: {}, BOWLING: { aim: 0, power: 0.75 }, MAZE: { moves: "" } })[kind];

test.describe.serial("월드코퍼챗", () => {
  let admin: User;

  test.beforeAll(async () => {
    admin = await signup("월드운영");
    await makeAdmin(admin);
    // 이벤트가 앞 시험에 끼어들지 않게 기본값보다 늦게
    expect((await setSettings(admin, { eventChance: 0, eventMinTurns: 6, dailyRewardCap: 3 })).status).toBe(200);
  });

  test.afterAll(async () => {
    await setSettings(admin, { eventChance: 0.35, eventMinTurns: 6, dailyRewardCap: 3 });
  });

  test("만들기: 문서 검사, 발행 조건, 그림·지도 검수, 공개 범위", async () => {
    const owner = await signup("월드제작");
    const { body } = await api<{ id: string }>("/worlds", { token: owner.token, method: "POST" });
    const id = body.id;
    // 발행 조건이 비어 있으면 거절하고 무엇이 빠졌는지 알려 준다
    const early = await api<{ message: string }>(`/worlds/${id}/publish`, { token: owner.token, json: { visibility: "PUBLIC" } });
    expect(early.status).toBe(400);
    expect(early.body.message).toContain("첫 장면");
    // 없는 장소를 가리키면 저장 거절
    const bad = await api(`/worlds/${id}`, { token: owner.token, method: "PUT", json: { world: { ...DOC, cast: [{ name: "X", summary: "s", startPlace: "달" }] } } });
    expect(bad.status).toBe(400);
    const saved = await api<Edit>(`/worlds/${id}`, { token: owner.token, method: "PUT", json: { world: DOC } });
    expect(saved.body.problems).toEqual([]);

    // 그림: 통과 · 검수 대기 · 거절, 없는 인물 이름표 거절
    const upload = (label: string, marker = "", character = "") =>
      api<{ review: string }>(`/worlds/${id}/images?label=${encodeURIComponent(label)}&character=${encodeURIComponent(character)}`, {
        token: owner.token,
        method: "PUT",
        raw: { type: "image/png", body: PNG(marker) },
      });
    expect((await upload("밤의 부두")).body.review).toBe("APPROVED");
    expect((await upload("서린 웃음", "E2E-REVIEW", "한서린")).body.review).toBe("PENDING");
    expect((await upload("막힐 그림", "E2E-BLOCK")).status).toBe(400);
    expect((await upload("유령", "", "없는사람")).status).toBe(400);
    expect((await api(`/worlds/${id}/map`, { token: owner.token, method: "PUT", raw: { type: "image/png", body: PNG() } })).status).toBe(200);

    // 발행 전에는 남이 못 본다. 만든 사람은 본다
    const other = await signup("월드구경");
    expect((await api(`/worlds/${id}`, { token: other.token })).status).toBe(404);
    expect((await api(`/worlds/${id}`, { token: owner.token })).status).toBe(200);
    expect((await api(`/worlds/${id}/edit`, { token: other.token })).status).toBe(403);

    expect((await api(`/worlds/${id}/publish`, { token: owner.token, json: { visibility: "UNLISTED" } })).status).toBe(200);
    // 링크 공개: 주소로는 보이지만 목록에는 없다. 상세에는 파트 목표를 싣지 않는다
    const detail = await api<{ parts: Record<string, unknown>[]; imageCount: number; hasMap: boolean }>(`/worlds/${id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.parts[0]).toEqual({ title: "낯선 배" });
    expect(detail.body.imageCount).toBe(1);
    expect(detail.body.hasMap).toBe(true);
    const list = await api<{ id: string }[]>("/worlds");
    expect(list.body.some((w) => w.id === id)).toBe(false);

    // 검수 대기 그림은 남에게 안 보이고, 만든 사람에게는 보인다
    const edit = await api<Edit>(`/worlds/${id}/edit`, { token: owner.token });
    const pending = edit.body.images.find((i) => i.label === "서린 웃음")!;
    expect((await api(`/worlds/${id}/images/${pending.id}`, { token: other.token })).status).toBe(404);
    expect((await api(`/worlds/${id}/images/${pending.id}`, { token: owner.token })).status).toBe(200);

    expect((await api(`/worlds/${id}/publish`, { token: owner.token, json: { visibility: "PUBLIC" } })).status).toBe(200);
    expect((await api<{ id: string }[]>("/worlds")).body.some((w) => w.id === id)).toBe(true);
  });

  test("플레이: 첫 장면 → 진행자 답 → 3턴마다 파트 판정 → 다음 파트, 마지막 파트 뒤 완료", async () => {
    const owner = await signup("월드제작2");
    const id = await makeWorld(owner);
    const player = await signup("월드플레이");
    const started = await startPlay(player, id);
    expect(started.play!.messages.map((m) => m.role)).toEqual(["CHARACTER", "SYSTEM"]);
    expect(started.play!.messages[1].content).toBe("1부 · 낯선 배");
    // 첫 장면은 "@: 서술"과 "이름: 대사" 조각으로 나뉜다
    expect(started.play!.messages[0].segments!.map((s) => s.speaker)).toEqual([null, "한서린"]);
    expect(started.play!.locations).toEqual({ 한서린: "부두", 도윤: "등대" });

    expect((await turn(player, id, "")).status).toBe(400);
    expect((await turn(player, id, "배를 살펴본다")).status).toBe(200);
    expect((await turn(player, id, "누가 타고 있었죠?")).status).toBe(200);
    // 3번째 턴에 판정. 표시가 없으면 넘어가지 않는다
    let state = (await turn(player, id, "단서가 없네요")).body;
    expect(state.play!.partIndex).toBe(0);
    await turn(player, id, "한 번 더");
    await turn(player, id, "조금 더");
    state = (await turn(player, id, "선원의 장부를 찾았다 [파트완료]")).body;
    expect(state.play!.partIndex).toBe(1);
    const systems = state.play!.messages.filter((m) => m.role === "SYSTEM").map((m) => m.content);
    expect(systems).toEqual(["1부 · 낯선 배", "1부 · 낯선 배 완료", "2부 · 등대의 밤"]);
    expect(state.play!.messages.at(-1)!.content).toBe("@: 등대로 가는 길에 바람이 거세진다.");

    await turn(player, id, "등대로 간다");
    await turn(player, id, "문을 두드린다");
    state = (await turn(player, id, "도윤 씨를 만났다 [파트완료]")).body;
    expect(state.play!.finished).toBe(true);
    expect(state.play!.messages.filter((m) => m.role === "SYSTEM").at(-1)!.content).toContain("모든 파트를 마쳤어요");
    // 끝난 뒤에도 이어 갈 수 있다
    expect((await turn(player, id, "계속 이야기하자")).status).toBe(200);

    // 처음부터: 기록이 지워지고 1부로
    const personas = await api<{ id: string }[]>("/me/personas", { token: player.token });
    const restarted = await api<State>(`/worlds/${id}/play`, { token: player.token, json: { personaId: personas.body[0].id, restart: true } });
    expect(restarted.body.play!.partIndex).toBe(0);
    expect(restarted.body.play!.messages).toHaveLength(2);
  });

  test("이벤트: 서버가 결과를 정하고, 승리 20~50·패배 5~10, 하루 3번까지만 보상", async () => {
    const owner = await signup("월드제작3");
    const id = await makeWorld(owner, { ...DOC, parts: [] });
    const player = await signup("월드이벤트");
    await startPlay(player, id);
    expect((await setSettings(admin, { eventChance: 1, eventMinTurns: 1 })).status).toBe(200);

    const credits = async () => (await api<{ balance: number; history: { delta: number; modelId: string }[] }>("/me/credits", { token: player.token })).body;
    const before = (await credits()).balance;
    let total = 0;
    for (let i = 0; i < 4; i++) {
      const state = (await turn(player, id, `이벤트 ${i}`)).body;
      const event = state.play!.event!;
      expect(event).toBeTruthy();
      // 숨긴 값(당첨 위치·커브)은 화면에 가지 않는다
      expect(JSON.stringify(event.view)).not.toMatch(/prize|winners|curve|rungs/);
      const played = await api<{ won: boolean; reward: number; rewarded: boolean; rewardedToday: number }>(`/worlds/${id}/play/events/${event.id}`, {
        token: player.token,
        json: inputFor(event.kind),
      });
      expect(played.status).toBe(200);
      if (i < 3) {
        expect(played.body.rewarded).toBe(true);
        const [min, max] = played.body.won ? [20, 50] : [5, 10];
        expect(played.body.reward).toBeGreaterThanOrEqual(min);
        expect(played.body.reward).toBeLessThanOrEqual(max);
        total += played.body.reward;
      } else {
        expect(played.body).toMatchObject({ rewarded: false, reward: 0, rewardedToday: 3 });
      }
      // 같은 이벤트를 두 번 하면 409
      expect((await api(`/worlds/${id}/play/events/${event.id}`, { token: player.token, json: inputFor(event.kind) })).status).toBe(409);
    }
    const after = await credits();
    expect(after.balance - before).toBe(total);
    expect(after.history.filter((h) => h.modelId?.startsWith("event:"))).toHaveLength(3);

    // 이벤트를 두고 이야기를 이어 가면 그 이벤트는 끝난다
    const open = (await turn(player, id, "이벤트를 두고 간다")).body.play!.event!;
    await turn(player, id, "그냥 계속");
    expect((await api(`/worlds/${id}/play/events/${open.id}`, { token: player.token, json: inputFor(open.kind) })).status).toBe(409);
    const rows = await sql<{ status: string }>(`select status from world_events where id = $1`, [open.id]);
    expect(rows[0].status).toBe("EXPIRED");
    // 남의 이벤트는 못 한다
    const stranger = await signup("월드남");
    await startPlay(stranger, id);
    expect((await api(`/worlds/${id}/play/events/${open.id}`, { token: stranger.token, json: {} })).status).toBe(404);
    await setSettings(admin, { eventChance: 0 });
  });

  test("운영자: 목록·검수·내리기·이벤트 기록·운영 설정 검사", async () => {
    const owner = await signup("월드제작4");
    const id = await makeWorld(owner);
    const pending = await api<{ id: string }>(`/worlds/${id}/images?label=${encodeURIComponent("검수 그림")}`, {
      token: owner.token,
      method: "PUT",
      raw: { type: "image/png", body: PNG("E2E-REVIEW") },
    });
    expect((await api("/admin/worlds", { token: owner.token })).status).toBe(403);

    const queue = await api<{ images: { id: string }[] }>("/admin/world-review", { token: admin.token });
    expect(queue.body.images.some((i) => i.id === pending.body.id)).toBe(true);
    const filtered = await api<{ id: string; pendingImages: number }[]>("/admin/worlds?filter=needs-review", { token: admin.token });
    expect(filtered.body.find((w) => w.id === id)?.pendingImages).toBe(1);
    expect((await api(`/admin/worlds/${id}/images/${pending.body.id}`, { token: admin.token })).status).toBe(200);
    expect((await api(`/admin/world-images/${pending.body.id}`, { token: admin.token, json: { decision: "approve" } })).status).toBe(200);
    expect((await api(`/worlds/${id}/images/${pending.body.id}`)).status).toBe(200);
    expect((await api(`/admin/world-images/${pending.body.id}`, { token: admin.token, json: { decision: "block" } })).status).toBe(200);
    expect((await api(`/worlds/${id}/images/${pending.body.id}`)).status).toBe(404);
    expect((await api(`/admin/world-images/${pending.body.id}`, { token: admin.token, json: { decision: "nope" } })).status).toBe(400);

    // 내리기: 사유가 필요하고, 내리면 목록·상세에서 사라지고 만든 사람만 사유를 본다
    expect((await api(`/admin/worlds/${id}/takedown`, { token: admin.token, json: {} })).status).toBe(400);
    expect((await api(`/admin/worlds/${id}/takedown`, { token: admin.token, json: { reason: "저작권 침해 신고" } })).status).toBe(200);
    expect((await api(`/worlds/${id}`)).status).toBe(404);
    const mine = await api<{ takenDown: { reason: string } }>(`/worlds/${id}`, { token: owner.token });
    expect(mine.body.takenDown.reason).toBe("저작권 침해 신고");
    expect((await api(`/worlds/${id}/publish`, { token: owner.token, json: { visibility: "PUBLIC" } })).status).toBe(403);
    expect((await api(`/admin/worlds/${id}/restore`, { token: admin.token, method: "POST" })).status).toBe(200);
    expect((await api(`/worlds/${id}`)).status).toBe(200);

    const stats = await api<{ worlds: number; today: { rewarded: number } }>("/admin/world-stats", { token: admin.token });
    expect(stats.body.worlds).toBeGreaterThan(0);
    const events = await api<{ label: string; play: { user: { email: string } } }[]>("/admin/world-events?status=all", { token: admin.token });
    expect(events.status).toBe(200);
    expect((await setSettings(admin, { dailyRewardCap: 1.5 })).status).toBe(400);
    expect((await setSettings(admin, { eventChance: 3 })).status).toBe(400);
    const settings = await api<{ dailyRewardCap: number }>("/admin/world-settings", { token: admin.token });
    expect(settings.body.dailyRewardCap).toBe(3);
  });

  test("화면: 만들기 → 편집기 저장·발행 → 플레이 시작 → 답 → 이벤트 → 코퍼맵", async ({ context }) => {
    const user = await signup("월드화면");
    await createPersona(user, "이안");
    const page = await signedInPage(context, user);

    await page.goto("/worlds");
    await page.getByRole("button", { name: "+ 새 세계관 만들기" }).click();
    await expect(page).toHaveURL(/\/worlds\/[^/]+\/edit$/);
    const title = uniq("화면월드");
    await page.getByTestId("world-title").fill(title);
    await page.getByTestId("world-setting").fill("구름 위에 떠 있는 섬나라. 바람의 길을 따라 비행선이 오간다.");
    await page.getByTestId("world-opening").fill("@: 비행선이 구름을 가르며 섬에 닿는다.");
    await page.getByRole("tab", { name: "등장인물" }).click();
    await page.getByTestId("cast-add").click();
    await page.getByTestId("cast-name").fill("하늘");
    await page.getByTestId("cast-summary").fill("비행선 조종사");
    await page.getByTestId("world-save").click();
    await expect(page.getByText("저장했어요.")).toBeVisible();
    await page.getByRole("tab", { name: "발행" }).click();
    await page.getByTestId("world-publish").click();
    await expect(page.getByText("발행했어요.")).toBeVisible();

    const worldId = page.url().split("/worlds/")[1].split("/")[0];
    await setSettings(admin, { eventChance: 1, eventMinTurns: 1, dailyRewardCap: 3 });
    await page.goto(`/worlds/${worldId}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await page.getByTestId("world-start").click();
    await expect(page).toHaveURL(new RegExp(`/worlds/${worldId}/play$`));
    await expect(page.getByTestId("world-part")).toHaveText("자유 진행");
    await expect(page.getByText("비행선이 구름을 가르며 섬에 닿는다.")).toBeVisible();

    await page.getByTestId("world-input").fill("안녕하세요, 하늘 씨");
    await page.getByTestId("world-send").click();
    await expect(page.getByTestId("world-reply")).toHaveCount(2);
    // 확률 1로 바꿨으니 이벤트가 뜬다. 종류에 맞게 한 번 한다
    const dialog = page.getByTestId("world-event");
    await expect(dialog).toBeVisible();
    if (await dialog.getByTestId("event-choice").count()) await dialog.getByTestId("event-choice").first().click();
    else if (await dialog.getByTestId("event-roll").count()) await dialog.getByTestId("event-roll").click();
    else if (await dialog.getByTestId("event-throw").count()) await dialog.getByTestId("event-throw").click();
    else await dialog.getByRole("button", { name: "포기" }).click();
    await expect(dialog.getByTestId("event-result")).toBeVisible();
    await dialog.getByTestId("event-close").click();
    await expect(dialog).toBeHidden();
    await setSettings(admin, { eventChance: 0 });
  });

  test("운영 콘솔: 월드 화면에서 목록·상세·운영 설정", async ({ context }) => {
    const owner = await signup("월드콘솔");
    const id = await makeWorld(owner);
    const page = await consolePage(context, admin);
    const C = URLS.console;
    await page.goto(`${C}/worlds`);
    await expect(page.getByRole("heading", { name: "월드코퍼챗", level: 1 })).toBeVisible();
    await page.getByRole("link", { name: "별빛 항구" }).first().click();
    await expect(page).toHaveURL(/\/worlds\/[^/]+$/);
    await page.goto(`${C}/worlds/${id}`);
    await expect(page.getByText("목표: 주인공이 배의 정체에 대한 단서를 얻는다")).toBeVisible();
    await page.goto(`${C}/worlds/settings`);
    await expect(page.getByLabel("하루 보상 횟수")).toHaveValue("3");
  });
});
