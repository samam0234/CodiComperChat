#!/usr/bin/env node
// 코드를 Oracle VM으로 올리고 AI 서버 배포 스크립트(deploy/oracle/ai-deploy.sh)를 실행한다.
// PC(Windows·macOS·Linux)에서 저장소 폴더 안에서 돌린다. 필요한 것: git, ssh(`ssh codicomper-oci`가 되어야 함), node.
//
//   node scripts/deploy-ai-oracle.mjs              # 전체 배포 (키가 서버에 없으면 터미널에서 물어봄)
//   node scripts/deploy-ai-oracle.mjs --key-only   # 키만 넣고 검사
//   node scripts/deploy-ai-oracle.mjs --dry-run    # 실행할 명령만 보여 줌
//   옵션: --host <ssh 이름>(기본 codicomper-oci)  --ref <git 참조>(기본: 자동)
//
// 작업 중인 브랜치·파일은 건드리지 않는다(git archive로 원격 참조만 보낸다). 키는 이 스크립트가 보지 않는다.
import { spawn, spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const has = (n) => args.includes(n);
const val = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const host = val('--host', 'codicomper-oci');
const dry = has('--dry-run');
const mode = has('--key-only') ? 'key' : 'all';
const NEED = 'deploy/oracle/ai-deploy.sh';

const say = (m) => console.log(m);
const fail = (m) => {
  console.error(`\n  ✗ ${m}\n`);
  process.exit(1);
};
const run = (cmd, a) => spawnSync(cmd, a, { encoding: 'utf8' });

say('== PC → Oracle VM: AI 서버 배포 ==');

// 1) 원격 최신화
say('[1/3] git fetch');
if (!dry) {
  const f = spawnSync('git', ['fetch', 'origin'], { stdio: 'inherit' });
  if (f.status !== 0) fail('git fetch 실패. 저장소 폴더 안에서 실행했는지, 인터넷이 되는지 확인한다.');
}

// 2) 올릴 참조: 기본은 origin/main (--ref로 다른 브랜치를 지정할 수 있다)
const candidates = val('--ref') ? [val('--ref')] : ['origin/main'];
const ref = candidates.find((r) => run('git', ['cat-file', '-e', `${r}:${NEED}`]).status === 0);
if (!ref) fail(`${candidates.join(', ')} 어디에도 ${NEED}가 없다. 'git fetch origin' 후 다시 시도한다.`);
const sha = run('git', ['rev-parse', '--short', ref]).stdout.trim();
say(`  · 올릴 코드: ${ref} (${sha})`);

// 3) 업로드 (git archive | ssh tar). 줄바꿈은 LF로 고정한다(.env 값 끝에 CR이 붙는 것을 막는다)
const sshBase = ['-o', 'ServerAliveInterval=30', host];
const archive = ['-c', 'core.autocrlf=false', '-c', 'core.eol=lf', 'archive', '--format=tar', ref];
const untar = [...sshBase, 'mkdir -p ~/codicomperchat && tar -x -C ~/codicomperchat'];
say('[2/3] 코드 업로드');
if (dry) {
  say(`  $ git ${archive.join(' ')} | ssh ${sshBase.join(' ')} "${untar[untar.length - 1]}"`);
} else {
  await new Promise((resolve) => {
    const g = spawn('git', archive, { stdio: ['ignore', 'pipe', 'inherit'] });
    const s = spawn('ssh', untar, { stdio: ['pipe', 'inherit', 'inherit'] });
    g.stdout.pipe(s.stdin);
    let gDone = null;
    let sDone = null;
    const end = () => {
      if (gDone === null || sDone === null) return;
      if (gDone !== 0) fail('git archive 실패.');
      if (sDone !== 0) fail(`업로드 실패. 'ssh ${host}' 로 접속이 되는지 먼저 확인한다.`);
      resolve();
    };
    g.on('close', (c) => { gDone = c ?? 1; end(); });
    s.on('close', (c) => { sDone = c ?? 1; end(); });
    s.on('error', () => fail('ssh를 실행할 수 없다. OpenSSH 클라이언트가 설치돼 있는지 확인한다.'));
  });
  say('  ✓ 업로드 완료 (서버의 .env는 덮어쓰지 않았다)');
}

// 4) 서버에서 실행. 터미널이 있으면 -t (키 입력용), 없으면 -T
say(`[3/3] 서버에서 배포 스크립트 실행 (${mode === 'key' ? '키만' : '전체'})\n`);
const tty = process.stdin.isTTY ? '-t' : '-T';
const remote = [tty, ...sshBase, `bash ~/codicomperchat/${NEED} ${mode}`];
if (dry) {
  say(`  $ ssh ${remote.slice(0, -1).join(' ')} "${remote[remote.length - 1]}"`);
  process.exit(0);
}
const r = spawnSync('ssh', remote, { stdio: 'inherit' });
if (r.error) fail('ssh를 실행할 수 없다.');
if (r.status === 255) fail(`서버에 접속하지 못했다. 'ssh ${host}' 가 되는지 확인한다.`);
process.exit(r.status ?? 1);
