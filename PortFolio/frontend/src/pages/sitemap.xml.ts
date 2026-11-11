import type { APIRoute } from "astro";
import { toc } from "../lib/content";

// 사이트에 있는 페이지 목록. 본문은 toc(목차)에서, 나머지는 고정 페이지다
const FIXED = ["/", "/data/", "/erd/", "/chat/", "/files/"];

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? "https://codicomperchat-portfolio.vercel.app";
  const paths = [...new Set([...FIXED, ...toc.map((t) => `/${t.slug}/`)])];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((p) => `  <url><loc>${new URL(p, origin).href}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
