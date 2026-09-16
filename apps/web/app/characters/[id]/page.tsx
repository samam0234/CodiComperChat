import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

type CharacterProfile = {
  heightCm?: number;
  weightKg?: number;
  age?: number;
  gender?: string;
  occupation?: string;
};

type CharacterDetail = {
  id: string;
  name: string;
  oneLiner: string;
  role: string;
  addressing: string;
  personalityAxes: string;
  speechStyle: string;
  knows: string;
  unknown: string;
  goal: string;
  conflictSeed: string;
  openingScene: string;
  profile: CharacterProfile | null;
};

async function getCharacter(id: string): Promise<CharacterDetail | null> {
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

  const res = await fetch(`${baseUrl}/characters/${id}`, { cache: "no-store" });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`캐릭터를 불러오지 못했습니다 (HTTP ${res.status})`);
  }

  return res.json();
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

const SETTING_FIELDS: { key: keyof CharacterDetail; label: string }[] = [
  { key: "addressing", label: "호칭" },
  { key: "personalityAxes", label: "성격 축" },
  { key: "speechStyle", label: "말투" },
  { key: "knows", label: "아는 것" },
  { key: "unknown", label: "모르는 것" },
  { key: "goal", label: "목표" },
  { key: "conflictSeed", label: "갈등 씨앗" },
];

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const character = await getCharacter(id);

  if (!character) {
    notFound();
  }

  return (
    <article>
      <Link href="/" className={styles.back}>
        ← 목록으로
      </Link>

      <header className={styles.header}>
        <h1 className={styles.name}>{character.name}</h1>
        <span className={styles.role}>{character.role}</span>
      </header>
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>인트로</h2>
        <p className={styles.intro}>{character.openingScene}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>설정</h2>
        <dl className={styles.settings}>
          {SETTING_FIELDS.map(({ key, label }) => (
            <div key={key} className={styles.settingItem}>
              <dt className={styles.settingLabel}>{label}</dt>
              <dd className={styles.settingValue}>{character[key] as string}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.hidden}>
          비밀과 해금 조건은 공개하지 않습니다. 캠페인을 진행하며 조건을 만족하면 드러납니다.
        </p>
      </section>
    </article>
  );
}
