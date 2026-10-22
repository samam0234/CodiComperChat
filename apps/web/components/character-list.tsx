import Link from "next/link";
import styles from "./character-list.module.css";

type CharacterProfile = {
  heightCm?: number;
  weightKg?: number;
  age?: number;
  gender?: string;
  occupation?: string;
};

type Character = {
  id: string;
  name: string;
  oneLiner: string;
  role: string;
  profile: CharacterProfile | null;
  portraitMime?: string | null;
  updatedAt?: string;
  // 운영 캐릭터인가 (아니면 유저가 공방에서 만든 캐릭터)
  official?: boolean;
};

type CharactersResult =
  | { ok: true; characters: Character[] }
  | { ok: false; message: string };

async function getCharacters(): Promise<CharactersResult> {
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/characters`, { cache: "no-store" });
  } catch {
    return {
      ok: false,
      message: `${baseUrl}에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요 (npm run dev:api).`,
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      message: `캐릭터 목록을 불러오지 못했습니다 (HTTP ${res.status}).`,
    };
  }

  return { ok: true, characters: await res.json() };
}

const PROFILE_FIELDS: {
  key: keyof CharacterProfile;
  suffix?: string;
}[] = [
  { key: "occupation" },
  { key: "age", suffix: "세" },
  { key: "gender" },
];

const ROLE_LABELS: Record<string, string> = {
  companion: "동료",
  rival: "라이벌",
  client: "의뢰인",
  guide: "가이드",
  wildcard: "와일드카드",
};

// 초상이 없는 캐릭터는 이름으로 정한 색의 그라데이션 위에 첫 글자를 크게 둔다 (캐릭터마다 다른 색이 늘 같게)
export function nameHue(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) % 360;
  return h;
}

export default async function CharacterList({
  emptyMessage = "아직 발행된 공식 캐릭터가 없습니다.",
}: {
  emptyMessage?: string;
}) {
  const result = await getCharacters();

  if (!result.ok) {
    return <p className={styles.notice}>{result.message}</p>;
  }

  if (result.characters.length === 0) {
    return <p className={styles.notice}>{emptyMessage}</p>;
  }

  return (
    <ul className={styles.grid}>
      {result.characters.map((character) => {
        const hue = nameHue(character.name);
        const chips = [
          ROLE_LABELS[character.role],
          ...PROFILE_FIELDS.map(({ key, suffix }) => {
            const value = character.profile?.[key];
            return value === undefined || value === null || value === "" ? undefined : `${value}${suffix ?? ""}`;
          }),
        ].filter((chip): chip is string => !!chip);
        return (
          <li key={character.id}>
            <Link href={`/characters/${character.id}`} className={styles.card}>
              <div className={styles.cover} style={{ "--hue": hue } as React.CSSProperties}>
                {character.portraitMime ? (
                  // 중계 라우트가 주는 이미지라 next/image 최적화를 거치지 않는다
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.portrait}
                    src={`/api/characters/${encodeURIComponent(character.id)}/portrait${character.updatedAt ? `?v=${encodeURIComponent(character.updatedAt)}` : ""}`}
                    alt={`${character.name} 초상`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className={styles.initial} aria-hidden="true">
                    {character.name.trim().slice(0, 1) || "?"}
                  </span>
                )}
                <span className={character.official === false ? styles.badge : `${styles.badge} ${styles.official}`}>
                  {character.official === false ? "유저 제작" : "공식"}
                </span>
                <span className={styles.name}>{character.name}</span>
              </div>
              <div className={styles.body}>
                <p className={styles.oneLiner}>{character.oneLiner}</p>
                {chips.length > 0 && (
                  <ul className={styles.chips} aria-label="프로필">
                    {chips.map((chip) => (
                      <li key={chip}>{chip}</li>
                    ))}
                  </ul>
                )}
                <span className={styles.cta} aria-hidden="true">
                  대화하기 <span>→</span>
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
