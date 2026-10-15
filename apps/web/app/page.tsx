import Link from "next/link";
import CharacterAvatar from "@/components/character-avatar";
import CharacterList from "@/components/character-list";
import { getCurrentUser } from "@/lib/auth";
import { getMyConversations } from "@/lib/conversations";
import styles from "./page.module.css";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  // 로그인했으면 이어서 할 대화(최근 3개)를 맨 위에 둔다
  const conversations = user ? ((await getMyConversations()) ?? []).filter((c) => c.active).slice(0, 3) : [];

  return (
    <>
      {params.bye === "1" && (
        <p className={styles.bye} role="status">
          탈퇴가 끝났어요. 그동안 함께해 주셔서 고마워요.
        </p>
      )}
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" /> 캐릭터 캠페인 동행
          </p>
          <h1 id="home-title" className={styles.title}>
            어제의 이야기를 기억하는
            <br />
            <span className={styles.gradientText}>나만의 캐릭터</span>와 대화해요
          </h1>
          <p className={styles.description}>
            말투와 성격이 흔들리지 않는 캐릭터가 지난 대화를 기억하고, 관계와 사건을 이어 갑니다. 마음에 드는 캐릭터가
            없다면 공방에서 직접 만들어 보세요.
          </p>
          <div className={styles.heroActions}>
            <a href="#characters" className={styles.primary}>
              캐릭터 둘러보기
            </a>
            <Link href={user ? "/studio" : "/signup?next=/studio"} className={styles.secondary}>
              직접 만들기
            </Link>
          </div>
        </div>

        {/* 장식: 대화가 오가는 모습 (화면 읽기 도구에는 숨긴다) */}
        <div className={styles.heroArt} aria-hidden="true">
          <div className={`${styles.bubble} ${styles.bubbleCharacter}`}>
            <span className={styles.bubbleName}>하루</span>
            어제 말한 시험, 잘 봤어요? 계속 마음에 걸렸거든요.
          </div>
          <div className={`${styles.bubble} ${styles.bubbleUser}`}>기억하고 있었어요? 생각보다 잘 봤어요!</div>
          <div className={`${styles.bubble} ${styles.bubbleCharacter}`}>
            <span className={styles.bubbleName}>하루</span>
            그럴 줄 알았어요. 오늘은 제가 축하 커피 살게요.
          </div>
          <div className={styles.relation}>
            <span>친밀도</span>
            <span className={styles.relationBar}>
              <span />
            </span>
            <span>+2</span>
          </div>
        </div>
      </section>

      {conversations.length > 0 && (
        <section className={styles.section} aria-labelledby="continue-title">
          <div className={styles.sectionHead}>
            <h2 id="continue-title" className={styles.sectionTitle}>
              이어서 대화하기
            </h2>
            <Link href="/library" className={styles.more}>
              대화 목록 전체 →
            </Link>
          </div>
          <ul className={styles.continueList}>
            {conversations.map((c) => (
              <li key={c.id}>
                <Link href={`/characters/${c.character.id}/chat`} className={styles.continueCard}>
                  <CharacterAvatar
                    characterId={c.character.id}
                    name={c.character.name}
                    hasPortrait={!!c.character.portraitMime}
                    version={c.character.updatedAt}
                  />
                  <span className={styles.continueBody}>
                    <span className={styles.continueName}>{c.character.name}</span>
                    <span className={styles.continuePreview}>
                      {c.lastMessage
                        ? `${c.lastMessage.role === "user" ? "나: " : ""}${c.lastMessage.text}`
                        : c.character.oneLiner}
                    </span>
                  </span>
                  <span className={styles.continueGo} aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section} id="characters" aria-labelledby="characters-title">
        <div className={styles.sectionHead}>
          <h2 id="characters-title" className={styles.sectionTitle}>
            캐릭터 선택
          </h2>
          <Link href="/popular" className={styles.more}>
            인기 캐릭터 →
          </Link>
        </div>
        <CharacterList emptyMessage="아직 시작할 수 있는 캐릭터가 없습니다." />
      </section>
    </>
  );
}
