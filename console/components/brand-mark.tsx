// 로고 표시: 말풍선 안의 별 (캐릭터와 이어지는 대화). 그라데이션은 같은 화면에 여러 번 그려도 겹치지 않게 id를 받는다
export default function BrandMark({ size = 30, id = "brand" }: { size?: number; id?: string }) {
  const gradient = `${id}-gradient`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6d4dff" />
          <stop offset="0.55" stopColor="#b45cff" />
          <stop offset="1" stopColor="#ff5fa2" />
        </linearGradient>
      </defs>
      <path
        d="M16 3C8.8 3 3 8.2 3 14.6c0 3.7 1.9 7 4.9 9.1L7 28.4c-.1.7.6 1.2 1.2.8l5-3c.9.2 1.8.3 2.8.3 7.2 0 13-5.2 13-11.6S23.2 3 16 3Z"
        fill={`url(#${gradient})`}
      />
      <path
        d="M16 8.6l1.55 3.9 4.2.3-3.23 2.7 1.02 4.1L16 17.35l-3.54 2.25 1.02-4.1-3.23-2.7 4.2-.3L16 8.6Z"
        fill="#fff"
      />
    </svg>
  );
}
