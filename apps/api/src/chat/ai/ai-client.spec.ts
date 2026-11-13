import { GatewayTimeoutException, HttpException } from '@nestjs/common';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { postToAi, streamFromAi, timeoutFromEnv } from './ai-client.js';

// 가짜 AI 서비스: 경로별로 늦게·실패로 답한다
let server: http.Server;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', async () => {
      if (req.url === '/stream') {
        res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
        const delta = Buffer.from(JSON.stringify({ delta: '안녕🙂' }) + '\n');
        const split = delta.indexOf(Buffer.from('안')) + 1;
        res.write(delta.subarray(0, split));
        await sleep(10);
        res.write(delta.subarray(split));
        await sleep(50);
        res.end(JSON.stringify({ done: true, reply: '안녕🙂' }) + '\n');
        return;
      }
      if (req.url === '/slow') await sleep(300);
      if (req.url === '/fail') {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: '모델이 없다' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ echo: JSON.parse(raw || '{}'), token: req.headers['x-ai-token'] ?? null, priority: req.headers['x-ai-priority'] ?? null }));
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  process.env.AI_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
  delete process.env.AI_BASE_URL;
});

describe('AI 호출 (node:http)', () => {
  it('나뉜 한글 바이트를 복원하고 완료 전부터 조각을 전달한다', async () => {
    const pieces: string[] = [];
    let receive!: () => void;
    const first = new Promise<void>((resolve) => { receive = resolve; });
    const pending = streamFromAi('/stream', {}, (piece) => {
      pieces.push(piece);
      receive();
    });
    await first;
    expect(pieces).toEqual(['안녕🙂']);
    await expect(pending).resolves.toEqual({ reply: '안녕🙂', shown: '안녕🙂' });
  });
  it('JSON을 보내고 받는다 (토큰 헤더 포함)', async () => {
    process.env.AI_SERVICE_TOKEN = 't'.repeat(32);
    const out = await postToAi<{ echo: { a: string }; token: string }>('/ok', { a: '안녕' });
    expect(out.echo.a).toBe('안녕');
    expect(out.token).toBe('t'.repeat(32));
    delete process.env.AI_SERVICE_TOKEN;
  });

  it('우선순위를 X-AI-Priority로 알린다 (배경 작업은 FastAPI가 CPU 예비로 내려가지 않는다)', async () => {
    const fg = await postToAi<{ priority: string }>('/ok', {});
    const bg = await postToAi<{ priority: string }>('/ok', {}, { priority: 'background' });
    expect(fg.priority).toBe('foreground');
    expect(bg.priority).toBe('background');
  });

  it('시간 제한을 넘기면 504로 바꾼다', async () => {
    await expect(postToAi('/slow', {}, { timeoutMs: 50 })).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it('제한 안이면 느린 답도 받는다', async () => {
    await expect(postToAi('/slow', { b: 1 }, { timeoutMs: 2000 })).resolves.toMatchObject({ echo: { b: 1 } });
  });

  it('AI 서비스의 오류 문구와 상태를 그대로 넘긴다', async () => {
    const error = await postToAi('/fail', {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(502);
    expect((error as HttpException).message).toBe('모델이 없다');
  });
});

describe('AI 시간 제한 환경변수', () => {
  afterEach(() => {
    delete process.env.AI_TIMEOUT_MS;
    delete process.env.AI_BACKGROUND_TIMEOUT_MS;
  });

  it('기본값은 기다리는 답 280초, 배경 600초', () => {
    expect(timeoutFromEnv('foreground')).toBe(280_000);
    expect(timeoutFromEnv('background')).toBe(600_000);
  });

  it('환경변수로 바꾸고, 잘못된 값은 무시한다', () => {
    process.env.AI_TIMEOUT_MS = '900000';
    process.env.AI_BACKGROUND_TIMEOUT_MS = 'abc';
    expect(timeoutFromEnv('foreground')).toBe(900_000);
    expect(timeoutFromEnv('background')).toBe(600_000);
  });
});
