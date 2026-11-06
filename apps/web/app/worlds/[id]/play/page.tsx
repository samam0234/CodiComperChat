import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPlayState } from "@/lib/worlds";
import WorldPlay from "./world-play";

export const metadata: Metadata = { title: "플레이 · 월드코퍼챗" };

export default async function WorldPlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/worlds/${id}/play`);
  const state = await getPlayState(id);
  if (!state) notFound();
  // 아직 시작하지 않았으면 소개 화면에서 주인공을 고르고 시작한다
  if (!state.play) redirect(`/worlds/${id}`);
  return <WorldPlay initial={state} />;
}
