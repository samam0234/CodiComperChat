import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getWorldForEdit } from "@/lib/worlds";
import WorldEditor from "./world-editor";

export const metadata: Metadata = { title: "세계관 편집 · 월드코퍼챗" };

export default async function WorldEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/worlds/${id}/edit`);
  const world = await getWorldForEdit(id);
  if (!world) notFound();
  return <WorldEditor initial={world} />;
}
