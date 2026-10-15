import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

const postToAi = vi.fn();
vi.mock('../ai/ai-client.js', () => ({ postToAi: (...args: unknown[]) => postToAi(...args) }));

const { PortraitReviewService } = await import('./portrait-review.service.js');

const image = { data: Buffer.from([0x89, 0x50, 0x4e, 0x47]), mime: 'image/png' as const };

describe('초상 자동 검수', () => {
  const service = new PortraitReviewService({} as never);

  it('문제 없으면 승인, 그림은 base64로 넘긴다', async () => {
    postToAi.mockResolvedValue({ verdict: 'ok', flags: [], reason: '' });
    expect(await service.moderate(image)).toEqual({ review: 'APPROVED', note: null });
    expect(postToAi).toHaveBeenCalledWith('/moderate-image', { image: image.data.toString('base64'), mime: 'image/png' });
  });

  it('애매하면 운영자 검수 대기와 그 이유', async () => {
    postToAi.mockResolvedValue({ verdict: 'review', flags: ['real_person'], reason: '실존 인물 사진 가능성이 있어 운영자가 확인해요.' });
    expect(await service.moderate(image)).toEqual({ review: 'PENDING', note: '실존 인물 사진 가능성이 있어 운영자가 확인해요.' });
  });

  it('명백히 안 되는 그림은 올리지 못한다(400)', async () => {
    postToAi.mockResolvedValue({ verdict: 'block', flags: ['sexual'], reason: '성적인 노출이(가) 보여 올릴 수 없어요.' });
    await expect(service.moderate(image)).rejects.toThrow(BadRequestException);
  });

  it('AI가 꺼져 있으면 통과시키지 않고 운영자 검수로 넘긴다', async () => {
    postToAi.mockImplementation(async () => {
      throw new ServiceUnavailableException('연결할 수 없습니다');
    });
    expect((await service.moderate(image)).review).toBe('PENDING');
  });
});
