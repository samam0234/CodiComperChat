import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getTheme } from "@/lib/theme";
import {
  DeleteAccountForm,
  LogoutButton,
  PasswordForm,
  ProfileForm,
  ThemeForm,
} from "./forms";
import styles from "./page.module.css";

const initialOf = (name: string) => Array.from(name.trim())[0] ?? "?";

export default async function SettingsPage() {
  const [user, theme] = await Promise.all([getCurrentUser(), getTheme()]);

  // 왼쪽 목차: 로그인 여부에 따라 보이는 설정만
  const menu = [
    { id: "display-settings", label: "화면" },
    ...(user
      ? [
          { id: "profile-settings", label: "계정" },
          { id: "password-settings", label: "비밀번호" },
          { id: "session-settings", label: "로그인" },
        ]
      : []),
    { id: "upcoming-settings", label: "알림 · 수위" },
    { id: "help-settings", label: "정책 · 도움말" },
    ...(user ? [{ id: "delete-settings", label: "회원 탈퇴" }] : []),
  ];

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>설정</h1>
        <p className={styles.description}>
          {user
            ? "화면과 계정을 내 마음에 맞게 바꿀 수 있습니다."
            : "로그인하지 않아도 화면 설정은 바꿀 수 있습니다. 이 기기에만 저장됩니다."}
        </p>
      </header>

      <div className={styles.layout}>
        <nav className={styles.menu} aria-label="설정 목차">
          <ul>
            {menu.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.content}>
          <section id="display-settings" className={styles.section} aria-labelledby="display-title">
            <h2 id="display-title" className={styles.heading}>
              화면
            </h2>
            <p className={styles.sectionLead}>사이트 전체의 밝기를 고릅니다. 이 기기에서 계속 유지됩니다.</p>
            <ThemeForm current={theme} />
          </section>

          {user ? (
            <>
              <section id="profile-settings" className={styles.section} aria-labelledby="profile-title">
                <h2 id="profile-title" className={styles.heading}>
                  계정
                </h2>
                <div className={styles.overview}>
                  <span className={styles.avatar} aria-hidden="true">
                    {initialOf(user.displayName)}
                  </span>
                  <dl>
                    <div>
                      <dt>요금 등급</dt>
                      <dd>
                        {user.plan === "PRO" ? "프로" : "무료"}{" "}
                        <Link href="/pricing" className={styles.inlineLink}>
                          {user.plan === "PRO" ? "기간 늘리기" : "프로 알아보기"}
                        </Link>
                      </dd>
                    </div>
                    <div>
                      <dt>이메일 인증</dt>
                      <dd className={user.emailVerified ? styles.ok : styles.warn}>
                        {user.emailVerified ? "완료" : "아직 안 했어요"}
                        {!user.emailVerified && (
                          <>
                            {" "}
                            <Link href="/me" className={styles.inlineLink}>
                              마이페이지에서 메일 받기
                            </Link>
                          </>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>가입일</dt>
                      <dd>{new Date(user.createdAt).toLocaleDateString("ko-KR")}</dd>
                    </div>
                  </dl>
                </div>
                <ProfileForm email={user.email} displayName={user.displayName} />
                <p className={styles.note}>
                  대화에서 쓰는 주인공 이름은 <Link href="/me" className={styles.inlineLink}>마이페이지의 내 프로필 캐릭터</Link>에서 따로 만듭니다.
                </p>
              </section>

              <section id="password-settings" className={styles.section} aria-labelledby="password-title">
                <h2 id="password-title" className={styles.heading}>
                  비밀번호
                </h2>
                <p className={styles.sectionLead}>바꾸면 다른 기기의 로그인은 모두 풀립니다.</p>
                <PasswordForm />
              </section>

              <section id="session-settings" className={styles.section} aria-labelledby="session-title">
                <h2 id="session-title" className={styles.heading}>
                  로그인
                </h2>
                <p className={styles.note}>{user.email}(으)로 로그인되어 있습니다.</p>
                <LogoutButton />
              </section>
            </>
          ) : (
            <section className={styles.callout}>
              <p>로그인하면 표시 이름, 비밀번호 같은 계정 설정이 여기에 추가됩니다.</p>
              <div className={styles.calloutActions}>
                <Link href="/login?next=/settings" className={styles.primaryLink}>
                  로그인
                </Link>
                <Link href="/signup?next=/settings" className={styles.secondaryLink}>
                  회원가입
                </Link>
              </div>
            </section>
          )}

          <section id="upcoming-settings" className={styles.section} aria-labelledby="upcoming-title">
            <h2 id="upcoming-title" className={styles.heading}>
              알림 · 콘텐츠 수위
            </h2>
            <ul className={styles.upcoming}>
              <li>
                <span>
                  <strong>콘텐츠 수위</strong>
                  <small>성인 콘텐츠 표시 여부를 정합니다.</small>
                </span>
                <span className={styles.soon}>준비 중</span>
              </li>
              <li>
                <span>
                  <strong>알림</strong>
                  <small>답장·공방 검수 결과를 알려 드립니다.</small>
                </span>
                <span className={styles.soon}>준비 중</span>
              </li>
            </ul>
          </section>

          <section id="help-settings" className={styles.section} aria-labelledby="help-title">
            <h2 id="help-title" className={styles.heading}>
              정책 · 도움말
            </h2>
            <ul className={styles.links}>
              <li>
                <Link href="/terms">이용약관</Link>
              </li>
              <li>
                <Link href="/privacy">개인정보처리방침</Link>
              </li>
              <li>
                <Link href="/support">고객센터</Link>
              </li>
            </ul>
          </section>

          {user && (
            <section id="delete-settings" className={`${styles.section} ${styles.dangerSection}`} aria-labelledby="delete-title">
              <h2 id="delete-title" className={styles.heading}>
                회원 탈퇴
              </h2>
              <DeleteAccountForm />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
