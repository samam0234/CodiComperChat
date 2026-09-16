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
  label: string;
  suffix?: string;
}[] = [
  { key: "occupation", label: "직업" },
  { key: "age", label: "나이", suffix: "세" },
  { key: "gender", label: "성별" },
  { key: "heightCm", label: "키", suffix: "cm" },
  { key: "weightKg", label: "몸무게", suffix: "kg" },
];

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
      {result.characters.map((character) => (
        <li key={character.id}>
          <Link href={`/characters/${character.id}`} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.name}>{character.name}</span>
              <span className={styles.role}>{character.role}</span>
            </div>
            <p className={styles.oneLiner}>{character.oneLiner}</p>
            {character.profile && (
              <dl className={styles.profile}>
                {PROFILE_FIELDS.map(({ key, label, suffix }) => {
                  const value = character.profile?.[key];
                  if (value === undefined || value === null || value === "") {
                    return null;
                  }
                  return (
                    <div key={key} className={styles.profileItem}>
                      <dt className={styles.profileLabel}>{label}</dt>
                      <dd>
                        {value}
                        {suffix}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
