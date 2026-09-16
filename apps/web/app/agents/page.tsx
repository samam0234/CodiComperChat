import AgentChat from "./agent-chat";
import styles from "./page.module.css";

export default function AgentsPage() {
  return (
    <section>
      <h1 className={styles.title}>에이전트</h1>
      <p className={styles.description}>
        코디컴퍼챗 사용법과 프롬프트를 물어보는 AI 챗봇입니다.
      </p>

      <AgentChat />
    </section>
  );
}
