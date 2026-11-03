#!/usr/bin/env node
// 커밋 기록 작성기. docs/branchs/commits/에 기록 파일을 만들고 docs/branchs/README.md 목록에 한 줄을 넣는다.
// 정본 규칙: .agents/skills/codicomperchat/SKILL.md §4, 형식: docs/branchs/TEMPLATE.md
//
//   node scripts/record-commit.mjs --name <kebab-이름> --notes <파일> [--sha HEAD] [--branch 브랜치] [--commit --trailer "Co-Authored-By: ..."]
//
// --notes 파일에는 "## 주 내용"부터 끝까지(TEMPLATE의 본문)를 쓴다. 제목·표·파일 이름은 git에서 읽는다.
// --commit을 주면 기록 파일과 목록을 "docs(branchs): 커밋 기록 <sha> 추가"로 바로 커밋한다.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FOOTER = '새 커밋 기록 md를';

// "feat(api): 무엇을 했다" → "무엇을 했다"
export function titleOf(subject) {
  return subject.replace(/^[a-z]+(\([^)]*\))?!?:\s*/, '');
}

// 2026-11-03 12:48:01 +0900 → { stamp: "261103_1248", day: "2026-11-03" }
export function dateParts(committed) {
  const m = /^(\d{2})(\d{2})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(committed);
  if (!m) throw new Error(`커밋 시각을 읽지 못했습니다: ${committed}`);
  return { stamp: `${m[2]}${m[3]}${m[4]}_${m[5]}${m[6]}`, day: `${m[1]}${m[2]}-${m[3]}-${m[4]}` };
}

export function fileNameOf({ stamp, short, name, branch }) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) throw new Error(`--name은 kebab-case여야 합니다: ${name}`);
  return `${stamp}_${short}_${name}_${branch.replaceAll('/', '-')}.md`;
}

export function recordOf({ title, subject, full, short, branch, parent, date, notes }) {
  return [
    `# ${title}`,
    '',
    '| 항목 | 내용 |',
    '|------|------|',
    `| Subject | \`${subject}\` |`,
    `| Full SHA | \`${full}\` |`,
    `| Short SHA | \`${short}\` |`,
    `| Branch | \`${branch}\` |`,
    `| Parent | \`${parent}\` |`,
    `| Date | ${date} |`,
    '',
    notes.trim(),
    '',
  ].join('\n');
}

// 표의 마지막 줄 뒤에 넣는다. 같은 커밋이 이미 있으면 그대로 돌려준다
export function addRow(index, { day, short, label, title, file }) {
  if (index.includes(`| \`${short}\` |`)) return index;
  const row = `| ${day} | \`${short}\` | ${label} | ${title.replaceAll('|', '\|')} | [${file}](commits/${file}) |`;
  const lines = index.split('\n');
  const at = lines.findIndex((l) => l.startsWith(FOOTER));
  if (at < 0) throw new Error('docs/branchs/README.md에서 목록 끝을 찾지 못했습니다.');
  let last = at - 1;
  while (last >= 0 && !lines[last].startsWith('|')) last -= 1;
  lines.splice(last + 1, 0, row);
  return lines.join('\n');
}

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function option(argv, flag) {
  const at = argv.indexOf(flag);
  return at >= 0 ? argv[at + 1] : undefined;
}

function main(argv) {
  const name = option(argv, '--name');
  const notesPath = option(argv, '--notes');
  if (!name || !notesPath) {
    console.error('사용법: node scripts/record-commit.mjs --name <kebab-이름> --notes <파일> [--sha HEAD] [--branch 브랜치] [--commit --trailer "..."]');
    process.exit(2);
  }
  const sha = option(argv, '--sha') ?? 'HEAD';
  const [full, subject, date, parents] = git('log', '-1', '--format=%H%n%s%n%ci%n%P', sha).split('\n');
  const short = full.slice(0, 7);
  const parentList = (parents ?? '').split(' ').filter(Boolean);
  const merge = parentList.length > 1;
  const branch = option(argv, '--branch') ?? git('branch', '--show-current');
  const { stamp, day } = dateParts(date);
  const title = titleOf(subject);
  const file = fileNameOf({ stamp, short, name, branch });
  const path = join(ROOT, 'docs', 'branchs', 'commits', file);
  if (existsSync(path)) throw new Error(`이미 있습니다: ${file}`);

  writeFileSync(
    path,
    recordOf({
      title,
      subject,
      full,
      short,
      branch,
      parent: parentList.map((p) => p.slice(0, 7)).join(', '),
      date,
      notes: readFileSync(notesPath, 'utf8'),
    }),
  );
  const indexPath = join(ROOT, 'docs', 'branchs', 'README.md');
  const index = readFileSync(indexPath, 'utf8');
  writeFileSync(indexPath, addRow(index, { day, short, label: merge ? `${branch} (merge)` : branch, title, file }));
  console.log(file);

  if (argv.includes('--commit')) {
    const trailer = option(argv, '--trailer');
    git('add', path, indexPath);
    const message = `docs(branchs): ${merge ? '병합' : '커밋'} 기록 ${short} 추가${trailer ? `\n\n${trailer}` : ''}`;
    git('commit', '-q', '-m', message);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
