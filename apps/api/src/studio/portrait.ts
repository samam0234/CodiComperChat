import { BadRequestException } from '@nestjs/common';

// 흉상 초상 이미지 (기획서 §6.2 "채팅 옆에 붙을 흉상 초상이 우선. 전신 일러스트 공장은 v1 범위 밖").
// 이미지 생성 모델이 없어 AI로 그려 주지는 않고, 유저가 올린 그림을 검사해 그대로 둔다.
// 웹이 정사각형으로 잘라 줄여 보내지만, 서버는 브라우저를 믿지 않고 형식·크기를 다시 검사한다

export const PORTRAIT_MAX_BYTES = 150_000;
export const PORTRAIT_MIMES = ['image/webp', 'image/jpeg', 'image/png'] as const;
export type PortraitMime = (typeof PORTRAIT_MIMES)[number];

const startsWith = (data: Uint8Array, bytes: number[], offset = 0) => bytes.every((b, i) => data[offset + i] === b);

// 파일 첫 바이트(매직 넘버)가 선언한 형식과 맞는지. Content-Type만 믿으면 아무 파일이나 그림으로 올릴 수 있다
function matchesMime(data: Uint8Array, mime: PortraitMime): boolean {
  switch (mime) {
    case 'image/png':
      return startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/jpeg':
      return startsWith(data, [0xff, 0xd8, 0xff]);
    case 'image/webp':
      // "RIFF" .... "WEBP"
      return startsWith(data, [0x52, 0x49, 0x46, 0x46]) && startsWith(data, [0x57, 0x45, 0x42, 0x50], 8);
  }
}

export function parsePortrait(contentType: unknown, body: unknown): { data: Buffer; mime: PortraitMime } {
  const mime = typeof contentType === 'string' ? (contentType.split(';')[0].trim().toLowerCase() as PortraitMime) : undefined;
  if (!mime || !PORTRAIT_MIMES.includes(mime)) {
    throw new BadRequestException('초상은 webp·jpeg·png 이미지만 올릴 수 있습니다.');
  }
  if (!Buffer.isBuffer(body) || body.length === 0) throw new BadRequestException('이미지가 비어 있습니다.');
  if (body.length > PORTRAIT_MAX_BYTES) {
    throw new BadRequestException(`초상은 ${Math.round(PORTRAIT_MAX_BYTES / 1000)}KB 이하여야 합니다 (지금 ${Math.round(body.length / 1000)}KB).`);
  }
  if (!matchesMime(body, mime)) throw new BadRequestException('이미지 파일이 아니거나 형식이 맞지 않습니다.');
  return { data: body, mime };
}
