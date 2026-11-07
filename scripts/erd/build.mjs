#!/usr/bin/env node
// ERD 생성기. 마이그레이션을 끝낸 PostgreSQL을 읽기만 해서(psql) Mermaid erDiagram을 만든다.
//
//   node scripts/erd/build.mjs --db postgresql://user:pass@localhost:5432/<마이그레이션을 마친 DB>
//
// 결과: docs/.assets/erd/*.mmd 를 새로 쓰고, docs/plan/ERD.md 의 <!-- erd:이름 --> … <!-- /erd:이름 --> 구간을 바꾼다.
// 그림(svg·png)은 scripts/erd/README.md 의 mmdc 명령으로 다시 그린다.
// 칸 순서는 schema.prisma 순서를 따른다(DB의 칸 순서는 ALTER로 붙은 순서라 읽기 어렵다).
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const db = argv[argv.indexOf('--db') + 1];
if (!argv.includes('--db') || !db) {
  console.error('사용법: node scripts/erd/build.mjs --db <마이그레이션을 마친 PostgreSQL URL>');
  process.exit(1);
}

const q = (sql) => JSON.parse(execFileSync('psql', [db, '-Atc', `select coalesce(json_agg(row_to_json(t)), '[]') from (${sql}) t`], { encoding: 'utf8' }));
const cols = q(`select table_name, column_name, is_nullable, udt_name, column_default, datetime_precision
  from information_schema.columns where table_schema = 'public' and table_name <> '_prisma_migrations' order by table_name, ordinal_position`);
const cons = q(`select conrelid::regclass::text tbl, contype, pg_get_constraintdef(oid) def,
  (select array_agg(a.attname order by k.ord) from unnest(conkey) with ordinality k(n, ord)
     join pg_attribute a on a.attrelid = conrelid and a.attnum = k.n) cols,
  confrelid::regclass::text ref
  from pg_constraint where connamespace = 'public'::regnamespace and conrelid::regclass::text <> '_prisma_migrations'`);
const idx = q(`select tablename tbl, indexname, indexdef from pg_indexes where schemaname = 'public' and tablename <> '_prisma_migrations'`);
const enums = q(`select t.typname, array_agg(e.enumlabel order by e.enumsortorder) labels
  from pg_type t join pg_enum e on e.enumtypid = t.oid group by t.typname order by t.typname`);

const schema = readFileSync(join(ROOT, 'apps/api/prisma/schema.prisma'), 'utf8');
const order = {};
for (const m of schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)) {
  const t = /@@map\("(\w+)"\)/.exec(m[2])?.[1] ?? m[1];
  order[t] = [...m[2].matchAll(/^\s+(\w+)\s+\w/gm)].map((x) => x[1]);
}

const unq = (s) => s.replace(/"/g, '');
const tables = [...new Set(cols.map((c) => c.table_name))];
const pk = {};
const fks = [];
for (const c of cons) {
  if (c.contype === 'p') pk[unq(c.tbl)] = c.cols;
  if (c.contype === 'f') {
    const del = /ON DELETE (SET NULL|CASCADE|RESTRICT|SET DEFAULT)/.exec(c.def)?.[1] ?? 'NO ACTION';
    const refcols = unq(/REFERENCES [^(]+\(([^)]+)\)/.exec(c.def)[1]).split(', ');
    fks.push({ tbl: unq(c.tbl), cols: c.cols, ref: unq(c.ref), refcols, del });
  }
}
const order0 = (f) => tables.indexOf(f.tbl) * 100 + f.cols.join().length;
fks.sort((a, b) => a.ref.localeCompare(b.ref) || a.tbl.localeCompare(b.tbl) || order0(a) - order0(b));
const uniques = {};
const indexes = {};
for (const i of idx) {
  if (/_pkey$/.test(i.indexname)) continue;
  const on = unq(/\((.*)\)$/.exec(i.indexdef)[1]).split(', ');
  const box = /UNIQUE/.test(i.indexdef) ? uniques : indexes;
  (box[i.tbl] ??= []).push(on);
}
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const TYPES = { text: 'text', int4: 'integer', jsonb: 'jsonb', bool: 'boolean', bytea: 'bytea', date: 'date', float8: 'float8', _text: 'text[]' };
const typeOf = (c) => (c.udt_name === 'timestamp' ? `timestamp(${c.datetime_precision})` : TYPES[c.udt_name] ?? c.udt_name);
const defOf = (d) => {
  if (d == null) return null;
  if (d === 'CURRENT_TIMESTAMP') return 'now()';
  const m = /^'(.*)'::/.exec(d);
  if (m) return m[1] === '' ? "''" : m[1];
  return d;
};
const at = (t, name) => (order[t] ?? []).indexOf(name);

function entity(t, stub) {
  const fkCols = new Set(fks.filter((f) => f.tbl === t).flatMap((f) => f.cols));
  const single = (uniques[t] ?? []).filter((u) => u.length === 1).map((u) => u[0]);
  const comp = (uniques[t] ?? []).filter((u) => u.length > 1);
  const lines = [];
  for (const c of cols.filter((c) => c.table_name === t).sort((a, b) => at(t, a.column_name) - at(t, b.column_name))) {
    const isPk = (pk[t] ?? []).includes(c.column_name);
    if (stub && !isPk) continue;
    const keys = [isPk && 'PK', fkCols.has(c.column_name) && 'FK', single.includes(c.column_name) && 'UK'].filter(Boolean);
    const notes = [];
    if (stub) notes.push(stub);
    if (c.is_nullable === 'YES') notes.push('NULL');
    const d = defOf(c.column_default);
    if (d) notes.push(`기본 ${d}`);
    for (const u of comp.filter((u) => u.includes(c.column_name))) notes.push(`UK(${u.join('+')})`);
    lines.push(`    ${typeOf(c)} ${c.column_name}${keys.length ? ` ${keys.join(',')}` : ''}${notes.length ? ` "${notes.join(' · ')}"` : ''}`);
  }
  return `  ${t} {\n${lines.join('\n')}\n  }`;
}

// 부모 쪽: 외래 키 칸이 NULL을 허용하면 0..1(|o), 아니면 정확히 1(||)
// 자식 쪽: 외래 키 칸이 고유(단독 UK 또는 PK와 같음)이면 0..1(o|), 아니면 0..N(o{)
function rel(f) {
  const nullable = f.cols.some((c) => cols.find((x) => x.table_name === f.tbl && x.column_name === c).is_nullable === 'YES');
  const oneToOne = (uniques[f.tbl] ?? []).some((u) => same(u, f.cols)) || same(pk[f.tbl] ?? [], f.cols);
  return `  ${f.ref} ${nullable ? '|o' : '||'}--${oneToOne ? 'o|' : 'o{'} ${f.tbl} : "${f.cols.join(',')} · ${f.del}"`;
}

const groups = [
  { id: 'account', tables: ['users', 'user_personas', 'email_tokens', 'payment_orders', 'credit_ledger', 'attendances', 'model_usage', 'quest_rewards'], stubs: {} },
  { id: 'chat', tables: ['characters', 'character_drafts', 'character_reports', 'content_reports', 'campaigns', 'campaign_states', 'sessions', 'messages', 'memory_chunks', 'user_extras', 'campaign_extras'], stubs: { users: '계정 그림에 전체' } },
  { id: 'ops', tables: ['mind_readings', 'diary_entries', 'direct_messages', 'board_posts', 'board_comments', 'photonet_images', 'webtoons', 'webtoon_panels'], stubs: { campaigns: '대화 그림에 전체' } },
  { id: 'world', tables: ['worlds', 'world_cast', 'world_places', 'world_parts', 'world_images', 'world_plays', 'world_messages', 'world_events'], stubs: { users: '계정 그림에 전체', characters: '대화 그림에 전체' } },
  { id: 'standalone', tables: ['rate_limit_buckets', 'app_settings'], stubs: {} },
];
const grouped = groups.flatMap((g) => g.tables);
const missing = tables.filter((t) => !grouped.includes(t));
const gone = grouped.filter((t) => !tables.includes(t));
if (missing.length || gone.length) {
  console.error(`그룹에 없는 테이블: ${missing.join(', ') || '-'} / DB에 없는 테이블: ${gone.join(', ') || '-'} — groups를 고친다`);
  process.exit(1);
}

const blocks = {};
for (const g of groups) {
  const set = new Set([...g.tables, ...Object.keys(g.stubs)]);
  const rels = fks.filter((f) => set.has(f.tbl) && set.has(f.ref) && (g.tables.includes(f.tbl) || g.tables.includes(f.ref))).map(rel);
  const ents = [...Object.entries(g.stubs).map(([t, n]) => entity(t, n)), ...g.tables.map((t) => entity(t))];
  blocks[g.id] = ['erDiagram', ...rels, ...ents].join('\n');
}
const isolated = tables.filter((t) => !fks.some((f) => f.tbl === t || f.ref === t));
blocks.overview = ['erDiagram', '  direction LR', ...fks.map(rel), ...isolated.map((t) => `  ${t}`)].join('\n');

const code = (s) => `\`${s}\``;
const list = (a) => a.map(code).join(', ');
blocks.counts = `테이블 **${tables.length}개** · 외래 키 **${fks.length}개** · 열거형 **${enums.length}개** · 마이그레이션 **${readdirSync(join(ROOT, 'apps/api/prisma/migrations'), { withFileTypes: true }).filter((d) => d.isDirectory()).length}개**`;
blocks.fks = ['| 외래 키 칸 | 가리키는 곳 | 부모를 지우면 |', '|---|---|---|', ...fks.map((f) => `| ${code(`${f.tbl}.${f.cols.join(', ')}`)} | ${code(`${f.ref}.${f.refcols.join(', ')}`)} | ${f.del} |`)].join('\n');
blocks.keys = [
  '| 테이블 | 종류 | 칸 |', '|---|---|---|',
  ...Object.entries(pk).filter(([, c]) => c.length > 1).sort().map(([t, c]) => `| ${code(t)} | 복합 PK | ${list(c)} |`),
  ...Object.entries(uniques).sort().flatMap(([t, l]) => l.map((c) => `| ${code(t)} | UNIQUE | ${list(c)} |`)),
  ...Object.entries(indexes).sort().flatMap(([t, l]) => l.map((c) => `| ${code(t)} | INDEX | ${list(c)} |`)),
].join('\n');
blocks.enums = ['| 열거형 | 값 |', '|---|---|', ...enums.map((e) => `| ${code(e.typname)} | ${e.labels.map(code).join(' · ')} |`)].join('\n');

const outDir = join(ROOT, 'docs/.assets/erd');
mkdirSync(outDir, { recursive: true });
for (const k of ['overview', ...groups.map((g) => g.id)]) writeFileSync(join(outDir, `${k}.mmd`), `${blocks[k]}\n`);

const docPath = join(ROOT, 'docs/plan/ERD.md');
let doc = readFileSync(docPath, 'utf8');
for (const [k, v] of Object.entries(blocks)) {
  const re = new RegExp(`(<!-- erd:${k} -->)[\\s\\S]*?(<!-- /erd:${k} -->)`);
  if (!re.test(doc)) continue;
  const body = k === 'overview' || groups.some((g) => g.id === k) ? `\`\`\`mermaid\n${v}\n\`\`\`` : v;
  doc = doc.replace(re, (_, a, b) => `${a}\n${body}\n${b}`);
}
writeFileSync(docPath, doc);
console.log(`ERD: 테이블 ${tables.length} · 외래 키 ${fks.length} · 열거형 ${enums.length} → docs/plan/ERD.md, docs/.assets/erd/*.mmd`);
