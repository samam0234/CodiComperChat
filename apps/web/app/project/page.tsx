import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

// 푸터 "프로젝트 소개" (2026-11-07 사용자 요청): 사업·업무 소개 톤으로, 가독성을 지키며 조금 화려하게.
// 숫자는 저장소 문서(docs/FEATURES.md, docs/plan/TESTING.md, docs/trainings)와 같은 값이다. 바꾸면 함께 고친다.
export const metadata: Metadata = {
  title: "프로젝트 소개 · 코디컴퍼챗",
  description: "기억하는 AI 캐릭터와 이어 가는 이야기 서비스, 코디컴퍼챗의 문제 정의 · 동작 방식 · 기술 구성 · 개발 과정",
};

const FACTS = [
  { value: "8주", label: "기획부터 실제 배포까지" },
  { value: "47", label: "화면 (이용자 35 · 운영 12)" },
  { value: "37", label: "데이터 테이블" },
  { value: "420+", label: "자동 시험 (API 232 · 화면 123 · AI 71)" },
];

const PROBLEMS = [
  { title: "잊지 않는 대화", before: "긴 대화가 쌓이면 앞일을 잊는다", after: "기억 · 지난 이야기 · 친밀도 · 복선을 따로 저장하고, 필요한 만큼만 꺼내 쓴다" },
  { title: "지어내지 않는 캐릭터", before: "설정에 없는 개인사를 지어낸다", after: "근거가 없으면 단정하지 않고, 지어냈으면 다시 쓴다" },
  { title: "지켜지는 비밀", before: "유도하면 비밀 설정을 털어놓는다", after: "비밀은 모델에 보내지 않고, 때가 되면 코드가 연다" },
];

const FLOW = [
  { step: "01", title: "확인", text: "로그인 · 공개 범위 · 연령 조건 · 코레딧을 서버가 먼저 확인합니다." },
  { step: "02", title: "맥락 조립", text: "캐릭터의 핵심 · 관련 지식 · 기억 · 지난 이야기를 필요한 만큼만 고릅니다." },
  { step: "03", title: "연기", text: "AI가 캐릭터로 답하고, 설정에 없는 이야기를 지어냈는지 한 번 더 봅니다." },
  { step: "04", title: "정리", text: "대화가 쌓이면 뒤에서 기억과 요약을 고쳐 다음 대화를 준비합니다." },
];

const SERVICES = [
  { name: "1:1 캐릭터 대화", text: "기억 · 친밀도 · 비밀 퀘스트로 관계가 쌓이는 대화" },
  { name: "월드코퍼챗", text: "한 세계관의 여러 인물 · 지도 · 파트 · 미니게임" },
  { name: "캐릭터 공방", text: "8단계 카드와 3턴 테스트를 거쳐 누구나 캐릭터를 발행" },
  { name: "오퍼레이션", text: "속마음 · 일기 · 문자 · 게시판 · 장면 그림 · 웹툰" },
];

const STACK = [
  ["이용자 웹 · 운영 콘솔", "Next.js 16 · React 19 · TypeScript"],
  ["백엔드 (신뢰 경계)", "Nest.js 12 · Prisma 7 · PostgreSQL 16"],
  ["AI 서비스", "FastAPI · Ollama · NVIDIA 호스팅 API · diffusers"],
  ["운영", "Vercel · Oracle Cloud · Docker Compose · Caddy · GitHub Actions"],
];

const TIMELINE = [
  { date: "2026.09", title: "기획과 기반", text: "기획 원본 합의, 모노레포(웹 · Nest · FastAPI), 데이터 모델" },
  { date: "2026.10", title: "대화의 핵심", text: "기억 · 요약 · 개인사 검사, 계정 · 결제 흐름, 화면 자동 시험" },
  { date: "2026.10", title: "만들고 그리는 기능", text: "캐릭터 공방, 코디포토넷 · 웹툰, 운영 콘솔, 비밀 퀘스트" },
  { date: "2026.11", title: "월드코퍼챗과 배포", text: "세계관 · 파트 · 미니게임, 운영 구성, 실제 서버 배포" },
];

const PORTFOLIO_URL = process.env.PORTFOLIO_URL;
const NOTION_URL = "https://app.notion.com/p/CodiComperChat-AI-411d7dec5e2e816cbc77e67c3a7d940e";

export default function ProjectPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>PROJECT OVERVIEW</p>
          <h1 className={styles.title}>
            어제의 이야기를 <span className={styles.gradient}>기억하는</span>
            <br />
            캐릭터와 이어 가는 캠페인
          </h1>
          <p className={styles.lead}>
            코디컴퍼챗은 유저가 주인공인 이야기를, 성격이 흔들리지 않는 AI 캐릭터가 함께 이어 가는 서비스입니다. 대화를 닫았다 다시 열어도
            캐릭터가 지난 일을 기억하고, 관계가 쌓이고, 숨겨 둔 비밀과 부탁이 때가 되면 드러납니다.
          </p>
          <div className={styles.actions}>
            <Link href="/" className={styles.primary}>캐릭터 둘러보기</Link>
            <Link href="/worlds" className={styles.secondary}>월드코퍼챗 보기</Link>
          </div>
        </div>
        <dl className={styles.facts}>
          {FACTS.map((f) => (
            <div key={f.label} className={styles.fact}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="why">
        <p className={styles.kicker}>WHY</p>
        <h2 id="why" className={styles.h2}>
          차별점은 모델이 아니라 <em>상태</em>입니다
        </h2>
        <p className={styles.sub}>무엇을 기억하고, 무엇을 숨기고, 무엇을 코드가 대신 판단할지를 설계했습니다.</p>
        <div className={styles.cards3}>
          {PROBLEMS.map((p) => (
            <article key={p.title} className={styles.card}>
              <h3>{p.title}</h3>
              <p className={styles.before}>{p.before}</p>
              <p className={styles.after}>{p.after}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="how">
        <p className={styles.kicker}>HOW IT WORKS</p>
        <h2 id="how" className={styles.h2}>대화 한 번이 지나가는 길</h2>
        <ol className={styles.flow}>
          {FLOW.map((f) => (
            <li key={f.step} className={styles.flowItem}>
              <span className={styles.step}>{f.step}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="services">
        <p className={styles.kicker}>SERVICES</p>
        <h2 id="services" className={styles.h2}>제공하는 기능</h2>
        <div className={styles.cards4}>
          {SERVICES.map((s) => (
            <article key={s.name} className={styles.service}>
              <h3>{s.name}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.split}`} aria-labelledby="stack">
        <div>
          <p className={styles.kicker}>TECHNOLOGY</p>
          <h2 id="stack" className={styles.h2}>기술 구성</h2>
          <p className={styles.sub}>
            웹은 백엔드만 알고, 백엔드만 데이터와 AI를 알고, AI는 데이터를 직접 보지 않습니다. 인증 · 권한 · 결제 판단을 한곳에 모아 안전하게
            운영합니다.
          </p>
        </div>
        <table className={styles.table}>
          <tbody>
            {STACK.map(([k, v]) => (
              <tr key={k}>
                <th scope="row">{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.section} aria-labelledby="timeline">
        <p className={styles.kicker}>MILESTONES</p>
        <h2 id="timeline" className={styles.h2}>개발 과정</h2>
        <ol className={styles.timeline}>
          {TIMELINE.map((t) => (
            <li key={t.title}>
              <span className={styles.date}>{t.date}</span>
              <div>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.cta} aria-labelledby="more">
        <h2 id="more">더 자세한 이야기</h2>
        <p>화면 · 구조 · 데이터 · 시험 결과와 시행착오는 포트폴리오에 정리해 두었습니다.</p>
        <div className={styles.actions}>
          {PORTFOLIO_URL && (
            <a href={PORTFOLIO_URL} className={styles.primary} target="_blank" rel="noopener noreferrer">
              포트폴리오 사이트
            </a>
          )}
          <a href={NOTION_URL} className={PORTFOLIO_URL ? styles.secondary : styles.primary} target="_blank" rel="noopener noreferrer">
            노션 포트폴리오
          </a>
          <Link href="/support" className={styles.secondary}>문의하기</Link>
        </div>
      </section>
    </main>
  );
}
