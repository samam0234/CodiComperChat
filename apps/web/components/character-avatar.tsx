import styles from "./character-avatar.module.css";

// 캐릭터 흉상 초상 (기획서 §6.2). 이미지는 Nest에서 가져오는 /api/characters/:id/portrait 중계를 거친다
// (비공개 캐릭터는 로그인 쿠키로만 보이게). 초상이 없으면 이름의 첫 글자로 대신한다
export default function CharacterAvatar({
  characterId,
  name,
  hasPortrait,
  version,
  size = "md",
}: {
  characterId: string;
  name: string;
  hasPortrait: boolean;
  // 초상이 바뀌면 달라지는 값(캐릭터 updatedAt). 브라우저 캐시를 새로 받게 한다
  version?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const initial = name.trim().slice(0, 1) || "?";
  if (!hasPortrait) {
    return (
      <span className={`${styles.avatar} ${styles[size]} ${styles.fallback}`} aria-hidden="true">
        {initial}
      </span>
    );
  }
  const src = `/api/characters/${encodeURIComponent(characterId)}/portrait${version ? `?v=${encodeURIComponent(version)}` : ""}`;
  return (
    // 중계 라우트가 주는 이미지라 next/image 최적화를 거치지 않는다
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`${styles.avatar} ${styles[size]}`} src={src} alt={`${name} 초상`} loading="lazy" decoding="async" />
  );
}
