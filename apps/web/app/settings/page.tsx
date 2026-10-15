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

export default async function SettingsPage() {
  const [user, theme] = await Promise.all([getCurrentUser(), getTheme()]);

  return (
    <>
      <h1 className={styles.title}>설정</h1>
      <p className={styles.description}>
        {user
          ? "화면 설정과 계정 설정을 바꿀 수 있습니다."
          : "로그인하지 않아도 화면 설정은 바꿀 수 있습니다. 이 기기에만 저장됩니다."}
      </p>

      <section className={styles.section} aria-labelledby="display-settings">
        <h2 id="display-settings" className={styles.heading}>
          화면
        </h2>
        <ThemeForm current={theme} />
      </section>

      <section className={styles.section} aria-labelledby="upcoming-settings">
        <h2 id="upcoming-settings" className={styles.heading}>
          준비 중
        </h2>
        <ul className={styles.upcoming}>
          <li>컨텐츠 수위</li>
          <li>알림</li>
        </ul>
      </section>

      {user ? (
        <>
          <section className={styles.section} aria-labelledby="profile-settings">
            <h2 id="profile-settings" className={styles.heading}>
              계정
            </h2>
            <ProfileForm email={user.email} displayName={user.displayName} />
          </section>

          <section className={styles.section} aria-labelledby="password-settings">
            <h2 id="password-settings" className={styles.heading}>
              비밀번호
            </h2>
            <PasswordForm />
          </section>

          <section className={styles.section} aria-labelledby="session-settings">
            <h2 id="session-settings" className={styles.heading}>
              로그인
            </h2>
            <p className={styles.note}>{user.email}(으)로 로그인되어 있습니다.</p>
            <LogoutButton />
          </section>

          <section className={styles.section} aria-labelledby="delete-settings">
            <h2 id="delete-settings" className={styles.heading}>
              회원 탈퇴
            </h2>
            <DeleteAccountForm />
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
    </>
  );
}
