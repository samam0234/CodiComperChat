"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveWorldSettings, type WorldSettings } from "@/app/actions/admin";
import styles from "../worlds.module.css";

export default function SettingsForm({ initial }: { initial: WorldSettings }) {
  const router = useRouter();
  const [cap, setCap] = useState(String(initial.dailyRewardCap));
  const [chance, setChance] = useState(String(Math.round(initial.eventChance * 100)));
  const [minTurns, setMinTurns] = useState(String(initial.eventMinTurns));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await saveWorldSettings({ dailyRewardCap: Number(cap), eventChance: Number(chance) / 100, eventMinTurns: Number(minTurns) });
    setBusy(false);
    if (!result.ok) {
      setMessage({ ok: false, text: result.error });
      return;
    }
    setMessage({ ok: true, text: "저장했습니다." });
    router.refresh();
  }

  return (
    <form className={`${styles.panel} ${styles.form}`} onSubmit={submit}>
      <label className={styles.field}>
        하루 보상 횟수
        <input type="number" min={0} max={20} step={1} value={cap} onChange={(e) => setCap(e.target.value)} required />
        <span className={styles.hint}>계정마다 한국 시각 하루에 코레딧을 받는 이벤트 수(0~20). 0이면 보상 없이 게임만 뜹니다. 사용자 결정 기본값 3.</span>
      </label>
      <label className={styles.field}>
        이벤트 확률 (%)
        <input type="number" min={0} max={100} step={1} value={chance} onChange={(e) => setChance(e.target.value)} required />
        <span className={styles.hint}>간격을 채운 뒤 턴마다 이벤트가 뜰 확률. 0이면 이벤트가 뜨지 않습니다. 기본 35%.</span>
      </label>
      <label className={styles.field}>
        이벤트 최소 간격 (턴)
        <input type="number" min={1} max={100} step={1} value={minTurns} onChange={(e) => setMinTurns(e.target.value)} required />
        <span className={styles.hint}>지난 이벤트 뒤 이만큼 대화해야 다음 이벤트가 뜰 수 있습니다(1~100). 기본 6.</span>
      </label>
      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={busy}>
          {busy ? "저장 중…" : "저장"}
        </button>
        {message && <span className={message.ok ? styles.saved : styles.error}>{message.text}</span>}
      </div>
    </form>
  );
}
