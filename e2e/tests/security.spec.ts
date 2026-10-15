import { expect, test } from "@playwright/test";
import { URLS } from "../env.mjs";
import { api, uniq } from "../helpers";

test.describe("보안·운영", () => {
  test("웹 응답에 보안 헤더가 붙는다", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"]).toContain("camera=()");
  });

  test("API 응답에도 보안 헤더가 붙고 서버 종류를 알리지 않는다", async () => {
    const res = await fetch(`${URLS.api}/health`);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    expect(res.headers.get("x-powered-by")).toBeNull();
  });

  test("약한 비밀번호로는 가입할 수 없다", async () => {
    for (const password of ["12345678", "password", "aaaaaaaa"]) {
      const res = await api("/auth/signup", { json: { email: `${uniq("weak")}@e2e.test`, password, displayName: "약함" } });
      expect(res.status, password).toBe(400);
    }
    const name = uniq("strong");
    const ok = await api("/auth/signup", { json: { email: `${name}@e2e.test`, password: "pass1234word", displayName: "튼튼" } });
    expect(ok.status).toBe(201);
  });

  test("약관·개인정보처리방침·고객센터·사업자 정보는 자리표시가 아니라 본문이 있다", async ({ page }) => {
    for (const [path, heading, mustHave] of [
      ["/terms", "이용약관", "사람이 아니라 AI"],
      ["/privacy", "개인정보처리방침", "비밀과 해금 조건은 AI에 전달하지 않습니다"],
      ["/support", "고객센터", "자주 묻는 것"],
      ["/business", "사업자 정보", "사업자등록번호"],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
      await expect(page.getByText(mustHave).first()).toBeVisible();
      // 아직 법률 검토 전 초안이라는 사실을 숨기지 않는다
      await expect(page.getByRole("note")).toContainText("초안");
      // 목차 링크가 본문으로 이어진다
      await expect(page.getByRole("navigation", { name: "목차" })).toBeVisible();
    }
  });

  test("푸터의 정책 링크가 각 문서로 이어진다", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("navigation", { name: "약관 및 정책" });
    for (const [name, url] of [["이용약관", "/terms"], ["개인정보처리방침", "/privacy"], ["고객센터", "/support"]] as const) {
      await footer.getByRole("link", { name }).click();
      await expect(page).toHaveURL(url);
    }
  });
});
