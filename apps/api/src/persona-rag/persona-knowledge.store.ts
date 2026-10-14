import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PersonaKnowledge,
  PersonaKnowledgeError,
  parsePersonaKnowledge,
} from './persona-knowledge.types.js';

// dist/persona-rag/ 와 src/persona-rag/ 어느 쪽에서도 apps/api/data/personas 를 가리킨다
const DEFAULT_DIR = fileURLToPath(new URL('../../data/personas', import.meta.url));

// 디스크를 매 요청마다 훑지 않도록 목록 확인 간격을 둔다. 파일을 고치면 이 간격 안에 반영된다
const RESCAN_INTERVAL_MS = 2000;

type Entry =
  | { ok: true; mtimeMs: number; knowledge: PersonaKnowledge }
  | { ok: false; mtimeMs: number; error: string };

export type StoreReport = {
  dir: string;
  loaded: { file: string; character: string; chunks: number }[];
  invalid: { file: string; error: string }[];
};

// 파일이 없거나 깨져도 채팅은 멈추지 않는다 — 그 캐릭터만 카드 원문 방식으로 되돌아간다
@Injectable()
export class PersonaKnowledgeStore {
  private readonly logger = new Logger(PersonaKnowledgeStore.name);
  private readonly entries = new Map<string, Entry>();
  private lastScan = 0;
  private dir: string = process.env.PERSONA_DATA_DIR ?? DEFAULT_DIR;

  // 테스트·CLI에서 폴더를 지정할 때 쓴다 (Nest 주입 대상이 되는 생성자 인자를 피한다)
  static at(dir: string): PersonaKnowledgeStore {
    const store = new PersonaKnowledgeStore();
    store.dir = dir;
    return store;
  }

  get directory(): string {
    return this.dir;
  }

  // 서버가 직접 파일을 쓴 뒤(공방 발행) 확인 간격을 기다리지 않고 다음 조회에서 바로 다시 훑는다
  invalidate(): void {
    this.lastScan = 0;
  }

  private scan(force: boolean): void {
    const now = Date.now();
    if (!force && now - this.lastScan < RESCAN_INTERVAL_MS) return;
    this.lastScan = now;

    let files: string[];
    try {
      // _ 로 시작하는 파일(예시·초안)은 읽지 않는다
      files = readdirSync(this.dir).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
    } catch {
      this.entries.clear();
      return;
    }

    for (const stale of this.entries.keys()) {
      if (!files.includes(stale)) this.entries.delete(stale);
    }

    for (const file of files) {
      const path = join(this.dir, file);
      let mtimeMs: number;
      try {
        mtimeMs = statSync(path).mtimeMs;
      } catch {
        this.entries.delete(file);
        continue;
      }
      if (this.entries.get(file)?.mtimeMs === mtimeMs) continue;

      try {
        const knowledge = parsePersonaKnowledge(JSON.parse(readFileSync(path, 'utf8')), file);
        this.entries.set(file, { ok: true, mtimeMs, knowledge });
      } catch (error) {
        const message =
          error instanceof PersonaKnowledgeError
            ? error.message
            : `${file}: JSON을 읽을 수 없다 (${(error as Error).message})`;
        this.entries.set(file, { ok: false, mtimeMs, error: message });
        this.logger.warn(`페르소나 지식 파일을 무시한다 — ${message}`);
      }
    }
  }

  get(characterName: string): PersonaKnowledge | null {
    this.scan(false);
    for (const entry of this.entries.values()) {
      if (entry.ok && entry.knowledge.character === characterName) return entry.knowledge;
    }
    return null;
  }

  report(): StoreReport {
    this.scan(true);
    const report: StoreReport = { dir: this.dir, loaded: [], invalid: [] };
    for (const [file, entry] of this.entries) {
      if (entry.ok) {
        report.loaded.push({
          file,
          character: entry.knowledge.character,
          chunks: entry.knowledge.chunks.length,
        });
      } else {
        report.invalid.push({ file, error: entry.error });
      }
    }
    return report;
  }
}
