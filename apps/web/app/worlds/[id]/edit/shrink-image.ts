// 올리기 전에 그림을 줄인다: 긴 변 maxSide 이하, webp로 maxBytes 아래가 될 때까지 품질을 낮춘다.
// 서버 한도(290KB)를 넘는 사진도 그대로 올릴 수 있게 브라우저에서 미리 줄인다
export async function shrinkImage(file: File, maxSide = 1600, maxBytes = 280_000): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일(webp·jpeg·png 등)을 골라 주세요.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  let width = Math.max(1, Math.round(bitmap.width * scale));
  let height = Math.max(1, Math.round(bitmap.height * scale));
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("그림을 읽지 못했어요.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    for (const quality of [0.86, 0.76, 0.66]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= maxBytes) return blob;
    }
    width = Math.round(width * 0.8);
    height = Math.round(height * 0.8);
  }
  throw new Error("그림을 충분히 줄이지 못했어요. 더 작은 그림을 골라 주세요.");
}
