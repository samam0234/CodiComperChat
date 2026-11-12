// 공식 세계관 정본(prisma/worlds/copper-city.json)이 편집기와 같은 검사를 통과하는지 본다.
// 시드는 TypeScript 검사기를 부르지 않으므로, 글자 수·장소 이름·좌표가 어긋나면 여기서 잡는다.
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WORLD_IMAGE_MAX_BYTES, WORLD_LIMITS, parseWorldDocument, publishProblems } from './world.js';

const PRISMA = join(__dirname, '..', '..', 'prisma');
const raw = JSON.parse(readFileSync(join(PRISMA, 'worlds', 'copper-city.json'), 'utf8'));

describe('공식 세계관 코퍼 시티', () => {
  const doc = parseWorldDocument(raw);

  it('편집기 검사를 통과하고 발행할 수 있다', () => {
    expect(publishProblems({ ...doc, castCount: doc.cast.length })).toEqual([]);
    expect(doc.cast.length).toBeGreaterThanOrEqual(2);
    expect(doc.parts.length).toBe(3);
  });

  it('모든 등장인물의 처음 있는 곳·사는 곳이 장소 목록에 있다', () => {
    const names = new Set(doc.places.map((p) => p.name));
    for (const c of doc.cast) {
      expect(names.has(c.startPlace)).toBe(true);
      expect(names.has(c.homePlace)).toBe(true);
    }
  });

  it('장소 핀이 지도 안쪽에 있고 서로 겹치지 않는다', () => {
    for (const p of doc.places) {
      expect(p.x).toBeGreaterThanOrEqual(5);
      expect(p.x).toBeLessThanOrEqual(95);
      expect(p.y).toBeGreaterThanOrEqual(5);
      expect(p.y).toBeLessThanOrEqual(95);
    }
    for (const a of doc.places)
      for (const b of doc.places) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(8);
  });

  it('장면 그림 이름표가 한도 안이고 그림 파일이 있으며 한도 이하다', () => {
    const art = join(PRISMA, 'assets', 'worlds', 'copper-city');
    expect(raw.images.length).toBeLessThanOrEqual(WORLD_LIMITS.images);
    for (const img of raw.images as { label: string; art: string; character: string }[]) {
      expect(img.label.length).toBeLessThanOrEqual(WORLD_LIMITS.imageLabel);
      if (img.character) expect(doc.cast.map((c) => c.name)).toContain(img.character);
      expect(statSync(join(art, `scene-${img.art}.jpg`)).size).toBeLessThanOrEqual(WORLD_IMAGE_MAX_BYTES);
    }
    expect(statSync(join(art, 'map.jpg')).size).toBeLessThanOrEqual(WORLD_IMAGE_MAX_BYTES);
  });
});
