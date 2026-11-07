#!/usr/bin/env node
// 공식 세계관 그림 만들기: 지도 1장 + 장면 그림 4장을 SVG로 그려 JPEG로 굽는다.
//   node scripts/world-art/build.mjs
// 좌표·이름은 apps/api/prisma/worlds/copper-city.json 한 곳에서 읽는다(시드와 같은 정본).
// 지도는 화면(코퍼맵)과 같은 16:10이고, 핀과 이름표는 화면이 겹쳐 그리므로 그림에는 글자를 넣지 않는다.
// 굽기는 저장소에 이미 있는 Playwright Chromium을 쓴다. 결과는 한 장에 290KB 이하여야 한다(WORLD_IMAGE_MAX_BYTES).
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORLD = JSON.parse(readFileSync(join(ROOT, 'apps/api/prisma/worlds/copper-city.json'), 'utf8'));
const OUT = join(ROOT, 'apps/api/prisma/assets/worlds/copper-city');
const MAX_BYTES = 290_000;

const W = 1600;
const H = 1000;
const at = (name) => {
  const p = WORLD.places.find((q) => q.name === name);
  if (!p) throw new Error(`장소가 없다: ${name}`);
  return [(p.x / 100) * W, (p.y / 100) * H];
};

// 같은 시드면 같은 그림이 나오게 (나무·창문 배치)
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const PAL = {
  ground: '#efe4cf',
  ground2: '#e6d6b9',
  block: '#d9c3a0',
  blockEdge: '#b99a6e',
  road: '#f7efe0',
  roadEdge: '#c9b089',
  river: '#7fa6b8',
  riverDeep: '#5d8aa0',
  park: '#a9c08a',
  parkDeep: '#86a36a',
  copper: '#b5651d',
  copperLight: '#d98c4a',
  verdigris: '#5fa39a',
  ink: '#3d2f22',
  glass: '#8fb3c9',
  brick: '#a8543a',
  glow: '#ffd27a',
};

function trees(r, x0, y0, x1, y1, n, size = 14) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    const k = size * (0.75 + r() * 0.5);
    s += `<circle cx="${x.toFixed(1)}" cy="${(y + k * 0.35).toFixed(1)}" r="${(k * 0.95).toFixed(1)}" fill="#000" opacity=".10"/>`;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${k.toFixed(1)}" fill="${PAL.parkDeep}"/>`;
    s += `<circle cx="${(x - k * 0.3).toFixed(1)}" cy="${(y - k * 0.3).toFixed(1)}" r="${(k * 0.45).toFixed(1)}" fill="${PAL.park}"/>`;
  }
  return s;
}

function buildingsGrid(r, x0, y0, x1, y1, cols, rows, fill, edge) {
  let s = '';
  const gw = (x1 - x0) / cols;
  const gh = (y1 - y0) / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (r() < 0.12) continue;
      const pad = 6 + r() * 6;
      const x = x0 + i * gw + pad;
      const y = y0 + j * gh + pad;
      const w = gw - pad * 2;
      const h = gh - pad * 2;
      s += `<rect x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="#000" opacity=".09"/>`;
      s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${fill}" stroke="${edge}" stroke-width="1.5"/>`;
      s += `<rect x="${(x + 4).toFixed(1)}" y="${(y + 4).toFixed(1)}" width="${(w - 8).toFixed(1)}" height="${(h * 0.28).toFixed(1)}" rx="2" fill="#fff" opacity=".18"/>`;
    }
  }
  return s;
}

// ─── 랜드마크 (좌표 중심에 그린다) ────────────────────────────
const LANDMARK = {
  중앙역([x, y]) {
    return `<g transform="translate(${x} ${y})">
      <rect x="-70" y="-26" width="140" height="56" rx="6" fill="#c8b08a" stroke="${PAL.ink}" stroke-width="2"/>
      <path d="M-78 -26 L0 -52 L78 -26 Z" fill="${PAL.verdigris}" stroke="${PAL.ink}" stroke-width="2"/>
      <circle cx="0" cy="-34" r="9" fill="#fff8e6" stroke="${PAL.ink}" stroke-width="2"/>
      ${[-48, -24, 0, 24, 48].map((dx) => `<rect x="${dx - 7}" y="-12" width="14" height="22" rx="7" fill="${PAL.glow}" opacity=".85"/>`).join('')}
    </g>`;
  },
  '아스테라 그룹 본사'([x, y]) {
    let win = '';
    for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) win += `<rect x="${-30 + j * 16}" y="${-118 + i * 14}" width="10" height="8" fill="${(i + j) % 3 ? '#dcecf5' : PAL.glow}" opacity=".9"/>`;
    return `<g transform="translate(${x} ${y + 40})">
      <ellipse cx="0" cy="8" rx="80" ry="16" fill="#000" opacity=".12"/>
      <path d="M-40 0 L-40 -130 L0 -150 L40 -130 L40 0 Z" fill="${PAL.glass}" stroke="${PAL.ink}" stroke-width="2.5"/>
      <path d="M0 -150 L0 0" stroke="#6f97ae" stroke-width="2"/>
      ${win}
      <rect x="-62" y="-30" width="124" height="30" rx="4" fill="#9fc0d3" stroke="${PAL.ink}" stroke-width="2"/>
      <rect x="-12" y="-18" width="24" height="18" fill="${PAL.glow}"/>
    </g>`;
  },
  '시립 기록관'([x, y]) {
    return `<g transform="translate(${x} ${y})">
      <rect x="-64" y="-20" width="128" height="50" fill="#e9dcc2" stroke="${PAL.ink}" stroke-width="2"/>
      <path d="M-72 -20 L0 -54 L72 -20 Z" fill="#d6c29d" stroke="${PAL.ink}" stroke-width="2"/>
      ${[-48, -24, 0, 24, 48].map((dx) => `<rect x="${dx - 5}" y="-18" width="10" height="46" fill="#f6efe0" stroke="${PAL.ink}" stroke-width="1.2"/>`).join('')}
      <rect x="-70" y="30" width="140" height="8" fill="#cdb68c" stroke="${PAL.ink}" stroke-width="1.5"/>
    </g>`;
  },
  '시계탑 광장'([x, y]) {
    let tiles = '';
    for (let a = 0; a < 24; a++) {
      const t = (a / 24) * Math.PI * 2;
      tiles += `<line x1="${(Math.cos(t) * 52).toFixed(1)}" y1="${(Math.sin(t) * 52).toFixed(1)}" x2="${(Math.cos(t) * 108).toFixed(1)}" y2="${(Math.sin(t) * 108).toFixed(1)}" stroke="#d8c7a6" stroke-width="2"/>`;
    }
    // 9시 7분: 시침은 9를 조금 지나, 분침은 7분(42도)
    const hour = ((9 + 7 / 60) / 12) * 360 - 90;
    const min = (7 / 60) * 360 - 90;
    const hand = (deg, len) => `<line x1="0" y1="-118" x2="${(Math.cos((deg * Math.PI) / 180) * len).toFixed(1)}" y2="${(-118 + Math.sin((deg * Math.PI) / 180) * len).toFixed(1)}" stroke="${PAL.ink}" stroke-width="3" stroke-linecap="round"/>`;
    return `<g transform="translate(${x} ${y})">
      <circle r="112" fill="#f3e8d2" stroke="${PAL.roadEdge}" stroke-width="3"/>
      ${tiles}
      <circle r="52" fill="#eadbbd" stroke="${PAL.roadEdge}" stroke-width="2"/>
      ${trees(rng(7), -100, -100, -60, 100, 0)}
      <ellipse cx="0" cy="14" rx="44" ry="12" fill="#000" opacity=".15"/>
      <rect x="-26" y="-96" width="52" height="108" fill="#c9a97a" stroke="${PAL.ink}" stroke-width="2.5"/>
      <rect x="-26" y="-96" width="52" height="10" fill="#b28e5d"/>
      <circle cx="0" cy="-118" r="24" fill="#fffaf0" stroke="${PAL.ink}" stroke-width="3"/>
      ${hand(hour, 12)}${hand(min, 19)}
      <circle cx="0" cy="-118" r="2.5" fill="${PAL.ink}"/>
      <path d="M-34 -140 L0 -196 L34 -140 Z" fill="${PAL.verdigris}" stroke="${PAL.ink}" stroke-width="2.5"/>
      <path d="M-34 -140 L0 -196 L0 -140 Z" fill="${PAL.copper}" opacity=".55"/>
      <rect x="-30" y="-142" width="60" height="6" fill="${PAL.copperLight}" stroke="${PAL.ink}" stroke-width="1.5"/>
      <rect x="-10" y="-8" width="20" height="20" rx="10" fill="${PAL.ink}" opacity=".7"/>
    </g>`;
  },
  '스터디카페 오답노트'([x, y]) {
    return `<g transform="translate(${x} ${y})">
      <rect x="-50" y="-24" width="100" height="54" rx="6" fill="#e7d3b0" stroke="${PAL.ink}" stroke-width="2"/>
      <path d="M-56 -24 Q0 -46 56 -24" fill="#7a9e7e" stroke="${PAL.ink}" stroke-width="2"/>
      ${[-34, -14, 6, 26].map((dx) => `<path d="M${dx} -24 l10 0 l-2 10 l-6 0 z" fill="#fff" opacity=".7"/>`).join('')}
      <rect x="-38" y="-4" width="40" height="24" fill="${PAL.glow}" opacity=".9" stroke="${PAL.ink}" stroke-width="1.5"/>
      <rect x="12" y="0" width="22" height="30" fill="#8a5a3c" stroke="${PAL.ink}" stroke-width="1.5"/>
    </g>`;
  },
  '한기철 시계수리점'([x, y]) {
    return `<g transform="translate(${x} ${y})">
      <rect x="-44" y="-26" width="88" height="56" fill="${PAL.brick}" stroke="${PAL.ink}" stroke-width="2"/>
      <path d="M-50 -26 L0 -50 L50 -26 Z" fill="#6d4a33" stroke="${PAL.ink}" stroke-width="2"/>
      <circle cx="0" cy="-8" r="12" fill="#fffaf0" stroke="${PAL.ink}" stroke-width="2"/>
      <line x1="0" y1="-8" x2="0" y2="-16" stroke="${PAL.ink}" stroke-width="2"/><line x1="0" y1="-8" x2="6" y2="-6" stroke="${PAL.ink}" stroke-width="2"/>
      <rect x="-32" y="8" width="26" height="18" fill="${PAL.glow}" opacity=".85"/>
      <rect x="10" y="6" width="18" height="24" fill="#4b3324"/>
      <g transform="translate(58 -30)"><circle r="14" fill="${PAL.copper}" stroke="${PAL.ink}" stroke-width="2"/><circle r="5" fill="#f3e8d2"/>${Array.from({ length: 8 }, (_, i) => `<rect x="-3" y="-19" width="6" height="7" fill="${PAL.copper}" stroke="${PAL.ink}" stroke-width="1" transform="rotate(${i * 45})"/>`).join('')}</g>
    </g>`;
  },
  '코퍼 거리'([x, y]) {
    let s = '';
    for (let i = 0; i < 6; i++) {
      const dx = -150 + i * 54;
      s += `<rect x="${dx}" y="-46" width="46" height="34" fill="${PAL.brick}" stroke="${PAL.ink}" stroke-width="1.5"/>`;
      s += `<rect x="${dx}" y="16" width="46" height="34" fill="#b9644a" stroke="${PAL.ink}" stroke-width="1.5"/>`;
      s += `<rect x="${dx + 8}" y="-36" width="10" height="10" fill="${PAL.glow}" opacity="${i % 2 ? 0.9 : 0.4}"/>`;
      s += `<rect x="${dx + 26}" y="26" width="10" height="10" fill="${PAL.glow}" opacity="${i % 2 ? 0.4 : 0.9}"/>`;
    }
    s += `<rect x="-156" y="-10" width="330" height="24" fill="#c98a6a" opacity=".55"/>`;
    for (let i = 0; i < 7; i++) s += `<circle cx="${-150 + i * 52}" cy="2" r="3.5" fill="${PAL.glow}"/>`;
    return `<g transform="translate(${x} ${y})">${s}</g>`;
  },
  '24시 편의점'([x, y]) {
    return `<g transform="translate(${x} ${y})">
      <circle r="58" fill="${PAL.glow}" opacity=".22"/>
      <rect x="-46" y="-22" width="92" height="48" fill="#f2f4f2" stroke="${PAL.ink}" stroke-width="2"/>
      <rect x="-46" y="-30" width="92" height="12" fill="#3f8f6d" stroke="${PAL.ink}" stroke-width="2"/>
      <rect x="-36" y="-12" width="72" height="26" fill="${PAL.glow}" stroke="${PAL.ink}" stroke-width="1.5"/>
    </g>`;
  },
  '강변 산책로'([x, y]) {
    return `<g transform="translate(${x} ${y})">
      ${[-90, -40, 10, 60].map((dx, i) => `<g transform="translate(${dx} ${i % 2 ? -6 : 6})"><rect x="-2" y="-30" width="4" height="30" fill="${PAL.ink}"/><circle cx="0" cy="-32" r="6" fill="${PAL.glow}"/></g>`).join('')}
      <rect x="-30" y="6" width="44" height="8" rx="3" fill="#8a5a3c"/><rect x="-26" y="14" width="4" height="8" fill="#5b3b28"/><rect x="6" y="14" width="4" height="8" fill="#5b3b28"/>
    </g>`;
  },
  '옛 선착장'([x, y]) {
    return `<g transform="translate(${x} ${y})">
      <rect x="-70" y="-14" width="120" height="22" fill="#9a7550" stroke="${PAL.ink}" stroke-width="2"/>
      ${[-60, -30, 0, 30].map((dx) => `<rect x="${dx}" y="8" width="6" height="22" fill="#6b4c32"/>`).join('')}
      <path d="M58 6 Q90 30 122 6 Z" fill="#a8543a" stroke="${PAL.ink}" stroke-width="2"/>
      <line x1="90" y1="8" x2="90" y2="-34" stroke="${PAL.ink}" stroke-width="2"/>
      <path d="M90 -32 L112 -8 L90 -8 Z" fill="#f3e8d2" stroke="${PAL.ink}" stroke-width="1.5"/>
      <g transform="translate(-30 -34)"><circle r="7" fill="#e3b58c" stroke="${PAL.ink}" stroke-width="1.5"/><path d="M-8 22 L0 6 L8 22 Z" fill="#5a6d8a"/><path d="M6 10 l14 -10" stroke="#8a5a3c" stroke-width="4" stroke-linecap="round"/></g>
    </g>`;
  },
};

function mapSvg() {
  const r = rng(907);
  const [cx, cy] = at('시계탑 광장');
  // 강: 아래쪽을 가로지른다
  const river = `M0 ${H * 0.8} C ${W * 0.2} ${H * 0.74}, ${W * 0.35} ${H * 0.86}, ${W * 0.55} ${H * 0.8} S ${W * 0.85} ${H * 0.72}, ${W} ${H * 0.78} L ${W} ${H} L 0 ${H} Z`;
  // 큰길: 역 → 광장 → 선착장, 본사 → 광장 → 코퍼 거리
  const roads = [
    `M ${at('중앙역').join(' ')} Q ${W * 0.3} ${H * 0.28} ${cx} ${cy}`,
    `M ${at('아스테라 그룹 본사').join(' ')} L ${cx} ${cy}`,
    `M ${at('시립 기록관').join(' ')} Q ${W * 0.68} ${H * 0.33} ${cx} ${cy}`,
    `M ${cx} ${cy} Q ${W * 0.62} ${H * 0.5} ${at('한기철 시계수리점').join(' ')}`,
    `M ${cx} ${cy} Q ${W * 0.32} ${H * 0.47} ${at('스터디카페 오답노트').join(' ')}`,
    `M ${cx} ${cy} Q ${W * 0.44} ${H * 0.62} ${at('코퍼 거리').join(' ')}`,
    `M ${cx} ${cy} Q ${W * 0.58} ${H * 0.62} ${at('24시 편의점').join(' ')}`,
    `M ${at('24시 편의점').join(' ')} Q ${W * 0.74} ${H * 0.78} ${at('옛 선착장').join(' ')}`,
    `M ${at('코퍼 거리').join(' ')} Q ${W * 0.33} ${H * 0.8} ${at('강변 산책로').join(' ')}`,
    `M 0 ${H * 0.33} Q ${W * 0.5} ${H * 0.3} ${W} ${H * 0.36}`,
  ];
  const roadSvg = roads
    .map((d) => `<path d="${d}" fill="none" stroke="${PAL.roadEdge}" stroke-width="30" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${PAL.road}" stroke-width="24" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#e2cfa9" stroke-width="2" stroke-dasharray="14 12"/>`)
    .join('');
  // 철길 (역에서 서쪽 바깥으로)
  const [sx, sy] = at('중앙역');
  const rail = `<path d="M ${sx - 70} ${sy + 34} L -20 ${sy + 34}" stroke="${PAL.ink}" stroke-width="10" stroke-dasharray="3 9"/><path d="M ${sx - 70} ${sy + 30} L -20 ${sy + 30} M ${sx - 70} ${sy + 38} L -20 ${sy + 38}" stroke="#6b5a48" stroke-width="2"/>`;
  // 오래된 지도 질감
  let grain = '';
  for (let i = 0; i < 260; i++) grain += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(0.6 + r() * 1.6).toFixed(1)}" fill="#8a6a44" opacity="${(0.04 + r() * 0.06).toFixed(2)}"/>`;
  const compass = `<g transform="translate(${W * 0.93} ${H * 0.58})">
    <circle r="46" fill="#f3e8d2" stroke="${PAL.ink}" stroke-width="2"/><circle r="38" fill="none" stroke="${PAL.copper}" stroke-width="1.5"/>
    <path d="M0 -40 L9 0 L0 40 L-9 0 Z" fill="${PAL.copper}" stroke="${PAL.ink}" stroke-width="1.5"/>
    <path d="M-40 0 L0 -7 L40 0 L0 7 Z" fill="${PAL.verdigris}" stroke="${PAL.ink}" stroke-width="1.5" opacity=".85"/>
    <path d="M0 -40 L9 0 L0 0 Z" fill="${PAL.ink}" opacity=".35"/>
    <text y="-52" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="${PAL.ink}">N</text>
  </g>`;
  const cartouche = `<g transform="translate(${W * 0.035} ${H * 0.56})">
    <rect width="230" height="96" rx="10" fill="#f6ecd8" stroke="${PAL.ink}" stroke-width="2"/>
    <rect x="7" y="7" width="216" height="82" rx="7" fill="none" stroke="${PAL.copper}" stroke-width="1.5"/>
    <text x="115" y="46" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="25" letter-spacing="3" fill="${PAL.ink}">COPPER CITY</text>
    <text x="115" y="74" text-anchor="middle" font-family="Georgia, serif" font-size="15" letter-spacing="3" fill="${PAL.copper}">— 9 : 07 —</text>
  </g>`;
  const landmarks = WORLD.places.map((p) => LANDMARK[p.name]?.(at(p.name)) ?? '').join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#5a3d1f" stop-opacity=".28"/></radialGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.river}"/><stop offset="1" stop-color="${PAL.riverDeep}"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${PAL.ground}"/>
    <path d="M0 ${H * 0.36} L ${W} ${H * 0.4} L ${W} ${H * 0.62} L 0 ${H * 0.6} Z" fill="${PAL.ground2}" opacity=".6"/>
    ${buildingsGrid(r, W * 0.02, H * 0.02, W * 0.98, H * 0.3, 16, 3, PAL.block, PAL.blockEdge)}
    ${buildingsGrid(r, W * 0.6, H * 0.38, W * 0.98, H * 0.68, 7, 3, PAL.block, PAL.blockEdge)}
    ${buildingsGrid(r, W * 0.02, H * 0.36, W * 0.4, H * 0.56, 7, 2, PAL.block, PAL.blockEdge)}
    ${buildingsGrid(r, W * 0.18, H * 0.6, W * 0.7, H * 0.78, 9, 2, '#d6a88a', '#a77456')}
    ${roadSvg}
    ${rail}
    <path d="${river}" fill="url(#water)"/>
    ${Array.from({ length: 14 }, (_, i) => `<path d="M ${80 + i * 110} ${H * 0.9 + (i % 3) * 12} q 14 -6 28 0 t 28 0" fill="none" stroke="#dff0f5" stroke-width="2" opacity=".6"/>`).join('')}
    <path d="M0 ${H * 0.8} C ${W * 0.2} ${H * 0.74}, ${W * 0.35} ${H * 0.86}, ${W * 0.55} ${H * 0.8} S ${W * 0.85} ${H * 0.72}, ${W} ${H * 0.78}" fill="none" stroke="${PAL.parkDeep}" stroke-width="14" opacity=".5"/>
    ${trees(r, W * 0.04, H * 0.76, W * 0.5, H * 0.82, 26, 13)}
    ${trees(r, W * 0.42, H * 0.38, W * 0.58, H * 0.42, 6, 11)}
    ${trees(r, W * 0.42, H * 0.53, W * 0.58, H * 0.57, 6, 11)}
    ${landmarks}
    ${compass}
    ${cartouche}
    ${grain}
    <rect width="${W}" height="${H}" fill="url(#vig)"/>
    <rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="${PAL.ink}" stroke-width="3" opacity=".55"/>
  </svg>`;
}

// ─── 장면 그림 (1280×800) ───────────────────────────────────
const SW = 1280;
const SH = 800;
function stars(r, n) {
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${(r() * SW).toFixed(0)}" cy="${(r() * SH * 0.5).toFixed(0)}" r="${(0.6 + r() * 1.4).toFixed(1)}" fill="#fff" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
  return s;
}
const SCENE = {
  clocktower() {
    const r = rng(11);
    const hour = ((9 + 7 / 60) / 12) * 360 - 90;
    const min = (7 / 60) * 360 - 90;
    const hand = (deg, len, w) => `<line x1="640" y1="300" x2="${(640 + Math.cos((deg * Math.PI) / 180) * len).toFixed(1)}" y2="${(300 + Math.sin((deg * Math.PI) / 180) * len).toFixed(1)}" stroke="#2a2420" stroke-width="${w}" stroke-linecap="round"/>`;
    return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2440"/><stop offset=".7" stop-color="#4a3f5e"/><stop offset="1" stop-color="#8a5a4a"/></linearGradient>
      <radialGradient id="lamp" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
      <rect width="${SW}" height="${SH}" fill="url(#sky)"/>${stars(r, 90)}
      <circle cx="1060" cy="120" r="46" fill="#f6ecd0" opacity=".9"/><circle cx="1078" cy="108" r="44" fill="#1f2846" opacity=".85"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 150 - 20}" y="${470 - (i % 3) * 40}" width="120" height="${330 + (i % 3) * 40}" fill="#2b2a3b"/>`).join('')}
      ${Array.from({ length: 40 }, () => `<rect x="${(r() * SW).toFixed(0)}" y="${(480 + r() * 260).toFixed(0)}" width="10" height="12" fill="#ffd27a" opacity="${(0.4 + r() * 0.5).toFixed(2)}"/>`).join('')}
      <rect x="560" y="300" width="160" height="500" fill="#6e5844"/><rect x="560" y="300" width="40" height="500" fill="#5a4636"/>
      <path d="M530 250 L640 90 L750 250 Z" fill="#4f8d85"/><path d="M640 90 L750 250 L640 250 Z" fill="#3b6f68"/>
      <rect x="540" y="244" width="200" height="16" fill="#b5651d"/>
      <circle cx="640" cy="300" r="64" fill="#f8f1e2" stroke="#2a2420" stroke-width="6"/>
      ${Array.from({ length: 12 }, (_, i) => { const t = (i / 12) * Math.PI * 2; return `<line x1="${640 + Math.cos(t) * 50}" y1="${300 + Math.sin(t) * 50}" x2="${640 + Math.cos(t) * 58}" y2="${300 + Math.sin(t) * 58}" stroke="#2a2420" stroke-width="4"/>`; }).join('')}
      ${hand(hour, 32, 7)}${hand(min, 50, 5)}<circle cx="640" cy="300" r="6" fill="#2a2420"/>
      <rect x="0" y="700" width="${SW}" height="100" fill="#3a3030"/>
      ${[220, 1060].map((x) => `<circle cx="${x}" cy="560" r="120" fill="url(#lamp)"/><rect x="${x - 4}" y="560" width="8" height="160" fill="#1c1a1a"/><circle cx="${x}" cy="556" r="12" fill="#ffd27a"/>`).join('')}
      <path d="M0 740 Q 320 720 640 742 T 1280 736 L1280 800 L0 800 Z" fill="#ffd27a" opacity=".12"/>`;
  },
  cafe() {
    const r = rng(23);
    return `<defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f4a3c"/><stop offset="1" stop-color="#2c332a"/></linearGradient>
      <radialGradient id="pend" r=".5"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".8"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient></defs>
      <rect width="${SW}" height="${SH}" fill="url(#wall)"/>
      <rect x="760" y="80" width="420" height="380" fill="#1d2a3a"/><rect x="760" y="80" width="420" height="380" fill="none" stroke="#6b4b33" stroke-width="16"/>
      <line x1="970" y1="80" x2="970" y2="460" stroke="#6b4b33" stroke-width="10"/>${Array.from({ length: 70 }, () => { const x = 775 + r() * 390, y = 92 + r() * 330; return `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 5).toFixed(0)}" y2="${(y + 22 + r() * 14).toFixed(0)}" stroke="#9fb7cc" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>`; }).join('')}
      ${Array.from({ length: 6 }, (_, i) => `<rect x="${60 + i * 100}" y="120" width="70" height="${180 + (i % 2) * 30}" fill="${['#a8543a', '#5f7f8f', '#b5651d', '#6a8a5a', '#8a6aa0', '#c08a4a'][i]}" opacity=".85"/>`).join('')}
      <rect x="40" y="330" width="660" height="14" fill="#6b4b33"/>
      ${[260, 640, 1010].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="130" stroke="#111" stroke-width="2"/><path d="M${x - 34} 130 L${x + 34} 130 L${x + 22} 160 L${x - 22} 160 Z" fill="#c9a27a"/><circle cx="${x}" cy="210" r="170" fill="url(#pend)"/>`).join('')}
      <rect x="0" y="560" width="${SW}" height="240" fill="#6b4b33"/><rect x="0" y="560" width="${SW}" height="20" fill="#8a6446"/>
      <rect x="380" y="500" width="420" height="70" rx="6" fill="#f3ead6" transform="rotate(-4 590 535)"/><line x1="590" y1="505" x2="586" y2="568" stroke="#c9b48e" stroke-width="2" transform="rotate(-4 590 535)"/>
      ${Array.from({ length: 7 }, (_, i) => `<line x1="${400 + i * 24}" y1="${515 + i * 6}" x2="${560 - i * 4}" y2="${515 + i * 6}" stroke="#9a8a70" stroke-width="2" transform="rotate(-4 590 535)"/>`).join('')}
      <rect x="860" y="500" width="70" height="80" rx="10" fill="#f8f3ea"/><path d="M930 520 q 28 0 28 22 q 0 20 -28 20" fill="none" stroke="#f8f3ea" stroke-width="8"/>
      ${[0, 1, 2].map((i) => `<path d="M${880 + i * 14} 490 q -10 -26 4 -46" fill="none" stroke="#fff" stroke-width="3" opacity=".35"/>`).join('')}
      <g transform="translate(180 420)"><circle cx="0" cy="-70" r="46" fill="#e8c4a2"/><path d="M-50 -80 Q 0 -150 50 -80 L 48 -66 Q 0 -100 -48 -66 Z" fill="#2c2420"/><path d="M-80 140 L-70 0 Q 0 -30 70 0 L80 140 Z" fill="#c9b18e"/><rect x="-22" y="-74" width="16" height="10" rx="3" fill="none" stroke="#2c2420" stroke-width="3"/><rect x="6" y="-74" width="16" height="10" rx="3" fill="none" stroke="#2c2420" stroke-width="3"/></g>`;
  },
  lobby() {
    return `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfdde6"/><stop offset="1" stop-color="#9fb4c2"/></linearGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9edf0"/><stop offset="1" stop-color="#b8c4cc"/></linearGradient></defs>
      <rect width="${SW}" height="${SH}" fill="url(#g)"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 150}" y="0" width="6" height="560" fill="#7b93a3" opacity=".6"/>`).join('')}
      ${Array.from({ length: 5 }, (_, i) => `<rect x="0" y="${i * 120}" width="${SW}" height="3" fill="#7b93a3" opacity=".4"/>`).join('')}
      <rect x="0" y="560" width="${SW}" height="240" fill="url(#floor)"/>
      <path d="M0 800 L540 560 M1280 800 L740 560 M640 800 L640 560" stroke="#c9d3da" stroke-width="2"/>
      <rect x="430" y="440" width="420" height="130" rx="6" fill="#2f3a44"/><rect x="430" y="440" width="420" height="16" fill="#b5651d"/>
      <text x="640" y="230" text-anchor="middle" font-family="Georgia, serif" font-size="58" letter-spacing="18" fill="#2f3a44" opacity=".85">ASTERA</text>
      <rect x="560" y="250" width="160" height="4" fill="#b5651d"/>
      <g transform="translate(900 380)"><circle cx="0" cy="-80" r="40" fill="#efcfb0"/><path d="M-42 -86 Q 0 -150 42 -86 Q 40 -60 34 -50 Q 0 -110 -34 -50 Q -40 -60 -42 -86 Z" fill="#141414"/><circle cx="0" cy="-128" r="16" fill="#141414"/><path d="M-62 190 L-56 -30 Q 0 -54 56 -30 L62 190 Z" fill="#1c1f26"/><path d="M-14 -36 L0 0 L14 -36 Z" fill="#f2f2f2"/><rect x="-74" y="20" width="56" height="74" rx="4" fill="#d9c7a5" transform="rotate(-8)"/></g>
      ${[160, 1120].map((x) => `<rect x="${x - 30}" y="470" width="60" height="90" rx="8" fill="#5a4a3c"/><circle cx="${x}" cy="440" r="56" fill="#5f8f6a"/><circle cx="${x - 20}" cy="420" r="30" fill="#7aa884"/>`).join('')}`;
  },
  river() {
    const r = rng(41);
    return `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121a33"/><stop offset=".6" stop-color="#2d3558"/><stop offset="1" stop-color="#4b4560"/></linearGradient>
      <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3d5c"/><stop offset="1" stop-color="#121b2e"/></linearGradient></defs>
      <rect width="${SW}" height="${SH}" fill="url(#s)"/>${stars(r, 120)}
      <circle cx="280" cy="140" r="54" fill="#f7eed4"/>
      ${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 84}" y="${300 - (i % 4) * 34}" width="72" height="${160 + (i % 4) * 34}" fill="#1f2340"/>`).join('')}
      ${Array.from({ length: 50 }, () => `<rect x="${(r() * SW).toFixed(0)}" y="${(290 + r() * 150).toFixed(0)}" width="8" height="9" fill="#ffd27a" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`).join('')}
      <rect x="610" y="150" width="48" height="310" fill="#2a2a3c"/><path d="M596 160 L634 90 L672 160 Z" fill="#3b6f68"/><circle cx="634" cy="196" r="17" fill="#f2e6cc"/>
      <rect y="460" width="${SW}" height="340" fill="url(#w)"/>
      <path d="M260 470 L250 800 L310 800 Z" fill="#f7eed4" opacity=".18"/>
      ${Array.from({ length: 40 }, () => { const x = r() * SW, y = 480 + r() * 300; return `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x + 20 + r() * 40).toFixed(0)}" y2="${y.toFixed(0)}" stroke="#ffd27a" stroke-width="2" opacity="${(0.15 + r() * 0.35).toFixed(2)}"/>`; }).join('')}
      <path d="M0 640 L1280 600 L1280 800 L0 800 Z" fill="#2a2432" opacity=".9"/>
      ${[120, 420, 720, 1020].map((x) => `<rect x="${x}" y="520" width="6" height="110" fill="#111"/><circle cx="${x + 3}" cy="516" r="12" fill="#ffd27a"/><circle cx="${x + 3}" cy="516" r="44" fill="#ffd27a" opacity=".12"/>`).join('')}
      <g transform="translate(900 610)"><rect x="-70" y="0" width="140" height="10" rx="4" fill="#5b3b28"/><rect x="-62" y="10" width="6" height="22" fill="#3a2618"/><rect x="56" y="10" width="6" height="22" fill="#3a2618"/></g>
      <g transform="translate(560 640)"><circle cy="-62" r="16" fill="#e8c4a2"/><path d="M-22 40 L-16 -40 Q 0 -50 16 -40 L22 40 Z" fill="#4a5a7a"/></g>`;
  },
};
const sceneSvg = (art) => `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}">${SCENE[art]()}</svg>`;

async function render(page, svg, w, h, file) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  for (const quality of [88, 82, 76, 70]) {
    const buf = await page.screenshot({ type: 'jpeg', quality, clip: { x: 0, y: 0, width: w, height: h } });
    if (buf.length <= MAX_BYTES) {
      writeFileSync(file, buf);
      return { file, bytes: buf.length, quality };
    }
  }
  throw new Error(`${file}이(가) ${MAX_BYTES}바이트를 넘는다`);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'map.svg'), mapSvg());
// playwright-core 버전이 기대하는 브라우저가 없으면, 이미 받아 둔 Chromium 중 하나를 쓴다
async function launch() {
  try {
    return await chromium.launch();
  } catch (e) {
    const { readdirSync, existsSync } = await import('node:fs');
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || join(process.env.LOCALAPPDATA || join(process.env.HOME || '', '.cache'), 'ms-playwright');
    const dirs = existsSync(base) ? readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse() : [];
    for (const d of dirs) {
      for (const exe of ['chrome-win64/chrome.exe', 'chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
        const p = join(base, d, exe);
        if (existsSync(p)) return chromium.launch({ executablePath: p });
      }
    }
    throw e;
  }
}
const browser = await launch();
const page = await browser.newPage();
const results = [await render(page, mapSvg(), W, H, join(OUT, 'map.jpg'))];
for (const img of WORLD.images) results.push(await render(page, sceneSvg(img.art), SW, SH, join(OUT, `scene-${img.art}.jpg`)));
await browser.close();
for (const r of results) console.log(`${r.file.replace(ROOT, '.')}  ${(statSync(r.file).size / 1024).toFixed(0)}KB  q${r.quality}`);
