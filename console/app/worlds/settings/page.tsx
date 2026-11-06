import type { Metadata } from "next";
import PageHead from "@/components/page-head";
import { adminGet, requireAdmin } from "@/lib/api";
import type { WorldSettings } from "@/app/actions/admin";
import WorldTabs from "../world-tabs";
import SettingsForm from "./settings-form";
import styles from "../worlds.module.css";

export const metadata: Metadata = { title: "월드코퍼챗 운영 설정 · 운영 콘솔" };

export default async function WorldSettingsPage() {
  await requireAdmin("/worlds/settings");
  const settings = await adminGet<WorldSettings>("/admin/world-settings");
  return (
    <>
      <PageHead title="운영 설정" description="이벤트 미니게임이 얼마나 자주 뜨고, 하루에 몇 번까지 코레딧을 주는지 정합니다. 저장하면 다음 턴부터 바로 적용됩니다." />
      <WorldTabs current="/worlds/settings" />
      {settings ? <SettingsForm initial={settings} /> : <p className={styles.error}>설정을 불러오지 못했습니다.</p>}
    </>
  );
}
