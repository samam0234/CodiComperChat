// 녹화에 자막을 입혀 MP4와 GIF를 만든다. FFMPEG 환경변수에 H.264 인코더가 있는 ffmpeg 경로를 준다
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CAPTIONS, caption, render } from "./art.mjs";
import { OUT, TMP } from "./env.mjs";

const ffmpeg = process.env.FFMPEG;
if (!ffmpeg) throw new Error("FFMPEG 환경변수에 ffmpeg 경로를 주세요");
const run = (...args) => execFileSync(ffmpeg, ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });

const steps = JSON.parse(readFileSync(join(TMP, "tour.json"), "utf8"));
const ranges = steps.slice(0, -1).map((step, index) => ({ id: step.id, from: step.at, to: steps[index + 1].at }));

const browser = await chromium.launch({ channel: "chrome" });
for (const { id } of ranges) {
  await render(browser, caption(CAPTIONS[id]), join(TMP, `caption-${id}.png`), { transparent: true });
}
await browser.close();

// 자막 입히기
const inputs = ["-i", join(TMP, "tour.webm"), ...ranges.flatMap(({ id }) => ["-i", join(TMP, `caption-${id}.png`)])];
let last = "0:v";
const filters = ranges.map(({ from, to }, index) => {
  const out = `v${index}`;
  const line = `[${last}][${index + 1}:v]overlay=enable='between(t,${from.toFixed(2)},${to.toFixed(2)})'[${out}]`;
  last = out;
  return line;
});
const H264 = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "27", "-r", "24", "-an"];
const tour = join(TMP, "tour-captioned.mp4");
run(...inputs, "-filter_complex", filters.join(";"), "-map", `[${last}]`, "-t", String(steps.at(-1).at), ...H264, tour);

// 제목 카드를 앞뒤에 붙인다
const still = (name, seconds) => {
  const out = join(TMP, `${name}.mp4`);
  run("-loop", "1", "-t", String(seconds), "-i", join(TMP, `${name}.png`), "-vf", "scale=1280:720", ...H264, out);
  return out;
};
const parts = [still("card-intro", 3), tour, still("card-outro", 3)];
run(...parts.flatMap((part) => ["-i", part]), "-filter_complex", `${parts.map((_, i) => `[${i}:v]`).join("")}concat=n=${parts.length}:v=1:a=0[v]`, "-map", "[v]", ...H264, "-movflags", "+faststart", join(OUT, "intro.mp4"));

// README에 바로 보이는 GIF (대화 구간, 그림 구간)
const gif = (name, from, to, width = 860, fps = 9) =>
  run("-ss", from.toFixed(2), "-to", to.toFixed(2), "-i", tour, "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, join(OUT, `${name}.gif`));
const at = Object.fromEntries(ranges.map((range) => [range.id, range]));
gif("demo-chat", at.chat.from, at.chat.to);
gif("demo-image", at.photonet.from, at.webtoon.to);
// MP4 표지
run("-ss", "1.5", "-i", tour, "-frames:v", "1", "-q:v", "4", join(OUT, "intro-poster.jpg"));
