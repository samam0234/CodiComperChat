"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { claimProClick } from "@/app/actions/billing";
import styles from "./pricing.module.css";

// 결제 없이 프로로 바꾼다. 정식 서비스 전에만 열린다 (apps/api/src/billing/pro-click.ts)
export default function ProClickButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claim = async () => {
    setBusy(true);
    setError(null);
    const result = await claimProClick();
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  };

  return (
    <div className={styles.buy}>
      <button type="button" className={styles.buyButton} onClick={() => void claim()} disabled={busy}>
        {busy ? "바꾸는 중…" : "프로로 바꾸기"}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
