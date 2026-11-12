import { AiBusyError, AiQueue } from './ai-queue.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 끝낼 때까지 열려 있는 작업. 순서·동시성을 눈으로 확인하려고 쓴다
function gate() {
  let open!: () => void;
  const promise = new Promise<void>((resolve) => (open = resolve));
  return { promise, open };
}

describe('AI 호출 대기열', () => {
  it('동시에 보내는 수를 제한한다', async () => {
    const queue = new AiQueue({ concurrency: 2 });
    let running = 0;
    let peak = 0;
    const task = async () => {
      running++;
      peak = Math.max(peak, running);
      await sleep(15);
      running--;
    };
    await Promise.all(Array.from({ length: 8 }, () => queue.run('foreground', task)));
    expect(peak).toBe(2);
  });

  it('기다리는 답이 배경 작업보다 먼저 나간다', async () => {
    const queue = new AiQueue({ concurrency: 1 });
    const g = gate();
    const order: string[] = [];
    const hold = queue.run('foreground', async () => g.promise); // 자리를 막아 둔다
    const bg = queue.run('background', async () => void order.push('배경'));
    const fg1 = queue.run('foreground', async () => void order.push('답1'));
    const fg2 = queue.run('foreground', async () => void order.push('답2'));
    await sleep(5);
    g.open();
    await Promise.all([hold, bg, fg1, fg2]);
    expect(order).toEqual(['답1', '답2', '배경']);
  });

  it('동시 호출이 2개 이상이면 배경 작업이 자리를 다 차지하지 못한다(기다리는 답 몫을 남긴다)', async () => {
    const queue = new AiQueue({ concurrency: 2 });
    const g = gate();
    const bg1 = queue.run('background', async () => g.promise);
    const bg2 = queue.run('background', async () => g.promise);
    await sleep(5);
    expect(queue.stats()).toMatchObject({ inFlight: 1, waitingBackground: 1 });
    // 남은 한 자리는 기다리는 답이 바로 쓴다
    const started = await queue.run('foreground', async () => 'ok');
    expect(started).toBe('ok');
    g.open();
    await Promise.all([bg1, bg2]);
  });

  it('배경 대기열이 가득 차면 새 배경 작업은 바로 거절한다(다음 기회에 다시)', async () => {
    const queue = new AiQueue({ concurrency: 1, maxBackgroundQueue: 2 });
    const g = gate();
    const hold = queue.run('foreground', async () => g.promise);
    const waiting = [queue.run('background', async () => 1), queue.run('background', async () => 2)];
    await expect(queue.run('background', async () => 3)).rejects.toBeInstanceOf(AiBusyError);
    g.open();
    await Promise.all([hold, ...waiting]);
  });

  it('기다리는 답이 너무 오래 기다리면 거절하고 안내한다', async () => {
    const queue = new AiQueue({ concurrency: 1, maxWaitMs: 30 });
    const g = gate();
    const hold = queue.run('foreground', async () => g.promise);
    await expect(queue.run('foreground', async () => 'late')).rejects.toMatchObject({ status: 503 });
    expect(queue.stats().waitingForeground).toBe(0);
    g.open();
    await hold;
  });

  it('작업이 실패해도 자리를 돌려준다', async () => {
    const queue = new AiQueue({ concurrency: 1 });
    await expect(queue.run('foreground', async () => Promise.reject(new Error('실패')))).rejects.toThrow('실패');
    expect(queue.stats().inFlight).toBe(0);
    expect(await queue.run('foreground', async () => 'ok')).toBe('ok');
  });
});
