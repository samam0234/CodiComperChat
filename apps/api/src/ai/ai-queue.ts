import { ServiceUnavailableException } from '@nestjs/common';

// AI(LLM) 호출 대기열. 모델 하나를 여러 사람이 나눠 쓰므로(로컬 Ollama는 보통 한 번에 한두 개만 처리한다)
// 무작정 동시에 보내면 요청이 모델 앞에서 줄을 서고, 그 줄에서 "사용자가 지금 기다리는 답"이
// "뒤에서 조용히 하는 정리 작업(기억·이야기 요약)"에 밀린다. 그래서:
//  1) 동시에 보내는 수를 제한하고(AI_CONCURRENCY, 기본 2)
//  2) 기다리는 답(foreground)을 항상 먼저 처리하며, 배경 작업(background)은 자리가 남을 때만 돌리고
//  3) 오래 기다린 요청은 계속 쌓아 두지 않고 안내와 함께 거절한다(foreground 60초, background 대기열 20개 초과)

export type Priority = 'foreground' | 'background';

type Waiter = { start: () => void; reject: (error: Error) => void; timer?: NodeJS.Timeout };

export class AiBusyError extends Error {}

export type QueueOptions = {
  concurrency: number;
  // 기다리는 답이 대기열에서 기다릴 수 있는 시간
  maxWaitMs: number;
  // 배경 작업 대기열 길이 상한 (넘으면 바로 거절. 배경 작업은 다음 기회에 다시 시도한다)
  maxBackgroundQueue: number;
};

export class AiQueue {
  private inFlight = 0;
  private readonly foreground: Waiter[] = [];
  private readonly background: Waiter[] = [];
  private readonly options: QueueOptions;

  constructor(options: Partial<QueueOptions> = {}) {
    this.options = { concurrency: 2, maxWaitMs: 60_000, maxBackgroundQueue: 20, ...options };
  }

  // 배경 작업은 한 자리를 항상 기다리는 답에게 남겨 둔다 (동시 2개면 배경은 1개까지)
  private get backgroundSlots() {
    return Math.max(1, this.options.concurrency - 1);
  }

  stats() {
    return {
      inFlight: this.inFlight,
      waitingForeground: this.foreground.length,
      waitingBackground: this.background.length,
      concurrency: this.options.concurrency,
    };
  }

  async run<T>(priority: Priority, task: () => Promise<T>): Promise<T> {
    await this.acquire(priority);
    try {
      return await task();
    } finally {
      this.inFlight -= 1;
      this.drain();
    }
  }

  private canStart(priority: Priority): boolean {
    if (this.inFlight >= this.options.concurrency) return false;
    if (priority === 'foreground') return true;
    // 배경은 기다리는 답이 없고, 배경 몫이 남아 있을 때만
    return this.foreground.length === 0 && this.inFlight < this.backgroundSlots;
  }

  private acquire(priority: Priority): Promise<void> {
    if (this.canStart(priority)) {
      this.inFlight += 1;
      return Promise.resolve();
    }
    const queue = priority === 'foreground' ? this.foreground : this.background;
    if (priority === 'background' && queue.length >= this.options.maxBackgroundQueue) {
      return Promise.reject(new AiBusyError('배경 작업 대기열이 가득 찼다'));
    }
    return new Promise<void>((resolve, reject) => {
      const waiter: Waiter = {
        start: () => {
          if (waiter.timer) clearTimeout(waiter.timer);
          this.inFlight += 1;
          resolve();
        },
        reject,
      };
      if (priority === 'foreground') {
        // 기다리는 사람에게 무한정 기다리게 하지 않는다
        waiter.timer = setTimeout(() => {
          const i = this.foreground.indexOf(waiter);
          if (i >= 0) this.foreground.splice(i, 1);
          reject(new ServiceUnavailableException('지금 대화가 많아 답을 만들지 못했어요. 잠시 뒤에 다시 보내 주세요.'));
        }, this.options.maxWaitMs);
        waiter.timer.unref();
      }
      queue.push(waiter);
    });
  }

  // 빈 자리가 생기면 기다리는 답 → 배경 작업 순서로 채운다
  private drain() {
    while (this.foreground.length > 0 && this.inFlight < this.options.concurrency) this.foreground.shift()!.start();
    while (this.background.length > 0 && this.canStart('background')) this.background.shift()!.start();
  }
}

// 프로세스 하나에 대기열 하나. AI_CONCURRENCY로 동시 호출 수를 조절한다(모델이 여러 요청을 병렬로 처리하면 키운다)
export function concurrencyFromEnv(): number {
  const n = Number(process.env.AI_CONCURRENCY ?? 2);
  return Number.isInteger(n) && n >= 1 ? n : 2;
}

export const aiQueue = new AiQueue({ concurrency: concurrencyFromEnv() });
