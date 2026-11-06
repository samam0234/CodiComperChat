"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  MODE_LABELS,
  VISIBILITY_LABELS,
  worldImageUrl,
  type CastEdit,
  type ImageMeta,
  type PartEdit,
  type Place,
  type Visibility,
  type WorldEdit,
  type WorldMode,
} from "@/lib/world-types";
import CopperMap from "../../copper-map";
import { shrinkImage } from "./shrink-image";
import styles from "./editor.module.css";

const TABS = [
  ["basic", "기본"],
  ["cast", "등장인물"],
  ["map", "장소·코퍼맵"],
  ["parts", "파트"],
  ["images", "장면 그림"],
  ["publish", "발행"],
] as const;
type Tab = (typeof TABS)[number][0];
type Candidate = { id: string; name: string; oneLiner: string; speechStyle: string };

const api = (worldId: string, path = "") => `/api/worlds/${encodeURIComponent(worldId)}${path}`;
async function message(res: Response, fallback: string) {
  const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
  return Array.isArray(data?.message) ? data.message.join(" ") : (data?.message ?? fallback);
}
const REVIEW_TEXT = { APPROVED: "공개됨", PENDING: "운영자 검수 대기", REJECTED: "검수 거절" } as const;

export default function WorldEditor({ initial }: { initial: WorldEdit }) {
  const router = useRouter();
  const [world, setWorld] = useState(initial);
  const [tab, setTab] = useState<Tab>("basic");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [mapVersion, setMapVersion] = useState(initial.updatedAt);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);

  function patch(update: Partial<WorldEdit>) {
    setWorld((w) => ({ ...w, ...update }));
    setDirty(true);
  }
  const say = (kind: "ok" | "error", text: string) => setNotice({ kind, text });

  async function save(): Promise<boolean> {
    setBusy(true);
    try {
      const { title, oneLiner, setting, rules, opening, mode, cast, places, parts } = world;
      const res = await fetch(api(world.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ world: { title, oneLiner, setting, rules, opening, mode, cast, places, parts } }),
      });
      if (!res.ok) {
        say("error", await message(res, "저장하지 못했어요."));
        return false;
      }
      setWorld((await res.json()) as WorldEdit);
      setDirty(false);
      say("ok", "저장했어요.");
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function publishAs(visibility: Visibility | null) {
    if (dirty && !(await save())) return;
    setBusy(true);
    try {
      const res = await fetch(api(world.id, visibility ? "/publish" : "/unpublish"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visibility ? { visibility } : {}),
      });
      if (!res.ok) return say("error", await message(res, "바꾸지 못했어요."));
      setWorld((await res.json()) as WorldEdit);
      say("ok", visibility ? "발행했어요." : "발행을 거뒀어요.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`「${world.title}」을(를) 지울까요? 플레이 기록과 그림도 모두 사라져요.`)) return;
    const res = await fetch(api(world.id), { method: "DELETE" });
    if (!res.ok) return say("error", await message(res, "지우지 못했어요."));
    router.push("/worlds");
  }

  async function upload(path: string, file: File) {
    setBusy(true);
    try {
      const blob = await shrinkImage(file);
      const res = await fetch(api(world.id, path), { method: "PUT", headers: { "Content-Type": blob.type }, body: blob });
      if (!res.ok) {
        say("error", await message(res, "올리지 못했어요."));
        return null;
      }
      return res.json();
    } catch (error) {
      say("error", error instanceof Error ? error.message : "올리지 못했어요.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.editor}>
      <header className={styles.top}>
        <div>
          <p className={styles.kicker}>세계관 편집기</p>
          <h1 className={styles.title}>{world.title || "새 세계관"}</h1>
          <p className={styles.state}>
            {world.takenDown
              ? `운영자가 내림 — ${world.takedownReason ?? ""}`
              : world.published
                ? `발행됨 · ${VISIBILITY_LABELS[world.visibility].split(" — ")[0]}`
                : "발행 전 (나만 시험 플레이할 수 있어요)"}
          </p>
        </div>
        <div className={styles.topActions}>
          <Link href={`/worlds/${world.id}`} className={styles.secondary}>
            미리보기·시험 플레이
          </Link>
          <button type="button" className={styles.primary} onClick={save} disabled={busy || !dirty} data-testid="world-save">
            {busy ? "처리 중…" : dirty ? "저장" : "저장됨"}
          </button>
        </div>
      </header>

      {notice && (
        <p className={notice.kind === "ok" ? styles.ok : styles.error} role="status">
          {notice.text}
        </p>
      )}

      <nav className={styles.tabs} role="tablist">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? styles.tabOn : styles.tab} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "basic" && <BasicTab world={world} patch={patch} />}
      {tab === "cast" && <CastTab world={world} patch={patch} />}
      {tab === "map" && (
        <MapTab
          world={world}
          patch={patch}
          version={mapVersion}
          selected={selectedPlace}
          setSelected={setSelectedPlace}
          onUpload={async (file) => {
            const r = (await upload("/map", file)) as { review: string; note: string | null } | null;
            if (!r) return;
            setWorld((w) => ({ ...w, hasMap: true, mapReview: r.review as WorldEdit["mapReview"] }));
            setMapVersion(String(Date.now()));
            say("ok", r.review === "PENDING" ? `지도를 올렸어요. ${r.note ?? "운영자가 확인한 뒤 다른 사람에게 보여요."}` : "지도를 올렸어요.");
          }}
          onRemove={async () => {
            const res = await fetch(api(world.id, "/map"), { method: "DELETE" });
            if (!res.ok) return say("error", await message(res, "지우지 못했어요."));
            setWorld((w) => ({ ...w, hasMap: false }));
          }}
        />
      )}
      {tab === "parts" && <PartsTab world={world} patch={patch} />}
      {tab === "images" && (
        <ImagesTab
          world={world}
          dirty={dirty}
          busy={busy}
          onUpload={async (label, character, file) => {
            const saved = (await upload(`/images?label=${encodeURIComponent(label)}&character=${encodeURIComponent(character)}`, file)) as ImageMeta | null;
            if (!saved) return false;
            setWorld((w) => ({ ...w, images: [...w.images.filter((i) => i.label !== saved.label), { ...saved, blocked: false }] }));
            say("ok", saved.review === "PENDING" ? "올렸어요. 운영자가 확인한 뒤 플레이에 나와요." : "올렸어요.");
            return true;
          }}
          onRemove={async (image) => {
            const res = await fetch(api(world.id, `/images/${encodeURIComponent(image.id)}`), { method: "DELETE" });
            if (!res.ok) return say("error", await message(res, "지우지 못했어요."));
            setWorld((w) => ({ ...w, images: w.images.filter((i) => i.id !== image.id) }));
          }}
        />
      )}
      {tab === "publish" && <PublishTab world={world} dirty={dirty} busy={busy} publishAs={publishAs} remove={remove} />}
    </div>
  );
}

type TabProps = { world: WorldEdit; patch: (u: Partial<WorldEdit>) => void };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}

function Counter({ value, max }: { value: string; max: number }) {
  return <span className={value.length > max ? styles.over : styles.count}>{value.length} / {max}</span>;
}

function BasicTab({ world, patch }: TabProps) {
  return (
    <section className={styles.panel}>
      <Field label="제목">
        <input value={world.title} maxLength={40} onChange={(e) => patch({ title: e.target.value })} data-testid="world-title" />
      </Field>
      <Field label="한 줄 소개">
        <input value={world.oneLiner} maxLength={120} onChange={(e) => patch({ oneLiner: e.target.value })} />
      </Field>
      <Field label="세계관 설명" hint="시대·장소·분위기·사회. 진행자가 이 글을 바탕으로 이야기를 만들어요. 20자 이상이어야 발행할 수 있어요.">
        <textarea rows={8} value={world.setting} maxLength={4000} onChange={(e) => patch({ setting: e.target.value })} data-testid="world-setting" />
        <Counter value={world.setting} max={4000} />
      </Field>
      <Field label="세계의 규칙 (선택)" hint="마법의 유무, 금기, 기술 수준처럼 진행자가 어기지 말아야 할 것.">
        <textarea rows={4} value={world.rules} maxLength={2000} onChange={(e) => patch({ rules: e.target.value })} />
      </Field>
      <Field label="첫 장면" hint="플레이를 시작하면 처음 보이는 글. 진행자는 앞 글의 모양을 따라 쓰니 대화 방식에 맞춰 쓰세요: 채팅·비주얼노벨은 `@: 서술`과 `이름: 대사`, 소설은 산문, 메신저는 `이름: 메시지` 줄.">
        <textarea rows={4} value={world.opening} maxLength={1000} onChange={(e) => patch({ opening: e.target.value })} data-testid="world-opening" />
      </Field>
      <fieldset className={styles.modes}>
        <legend className={styles.label}>대화 방식</legend>
        {(Object.keys(MODE_LABELS) as WorldMode[]).map((mode) => (
          <label key={mode} className={world.mode === mode ? styles.modeOn : styles.mode}>
            <input type="radio" name="mode" value={mode} checked={world.mode === mode} onChange={() => patch({ mode })} />
            <strong>{MODE_LABELS[mode].label}</strong>
            <span>{MODE_LABELS[mode].hint}</span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}

function CastTab({ world, patch }: TabProps) {
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const setCast = (cast: CastEdit[]) => patch({ cast });
  const update = (i: number, u: Partial<CastEdit>) => setCast(world.cast.map((c, j) => (j === i ? { ...c, ...u } : c)));
  const placeNames = world.places.map((p) => p.name);

  async function search() {
    const res = await fetch(`/api/worlds/cast-candidates?q=${encodeURIComponent(q)}`);
    setCandidates(res.ok ? ((await res.json()) as Candidate[]) : []);
  }

  return (
    <section className={styles.panel}>
      <p className={styles.lead}>
        등장인물은 최대 12명이에요. 이미 있는 캐릭터를 데려오거나 여기서 바로 써요. 카드 전체(말투·비밀·퀘스트)를 갖춘 캐릭터를 새로 만들려면{" "}
        <Link href="/studio" className={styles.link}>
          캐릭터 공방
        </Link>
        에서 만들어 발행한 뒤 데려오세요.
      </p>
      <div className={styles.row}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="데려올 캐릭터 이름" aria-label="데려올 캐릭터 검색" />
        <button type="button" className={styles.secondary} onClick={search}>
          찾기
        </button>
        <button
          type="button"
          className={styles.secondary}
          disabled={world.cast.length >= 12}
          onClick={() => setCast([...world.cast, { name: "", summary: "", speech: "", startPlace: "", homePlace: "", characterId: null }])}
          data-testid="cast-add"
        >
          + 직접 쓰기
        </button>
      </div>
      {candidates && (
        <ul className={styles.candidates}>
          {candidates.length === 0 && <li className={styles.hint}>데려올 수 있는 캐릭터가 없어요.</li>}
          {candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                disabled={world.cast.length >= 12 || world.cast.some((m) => m.characterId === c.id || m.name === c.name)}
                onClick={() =>
                  setCast([
                    ...world.cast,
                    { name: c.name.slice(0, 20), summary: c.oneLiner.slice(0, 600), speech: c.speechStyle.slice(0, 200), startPlace: "", homePlace: "", characterId: c.id },
                  ])
                }
              >
                <strong>{c.name}</strong> <span>{c.oneLiner}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <ol className={styles.items}>
        {world.cast.map((c, i) => (
          <li key={i} className={styles.item} data-testid="cast-item">
            <div className={styles.itemHead}>
              <span className={styles.badge}>{c.characterId ? "데려온 캐릭터" : "직접 쓴 인물"}</span>
              <button type="button" className={styles.remove} onClick={() => setCast(world.cast.filter((_, j) => j !== i))} aria-label={`${c.name || "인물"} 빼기`}>
                빼기
              </button>
            </div>
            <div className={styles.grid2}>
              <Field label="이름">
                <input value={c.name} maxLength={20} onChange={(e) => update(i, { name: e.target.value })} data-testid="cast-name" />
              </Field>
              <Field label="말투">
                <input value={c.speech} maxLength={200} onChange={(e) => update(i, { speech: e.target.value })} placeholder="예: 존댓말, 짧게 끊어 말함" />
              </Field>
            </div>
            <Field label="소개" hint="나이·직업·성격·다른 인물과의 관계. 진행자가 이 인물을 연기하는 근거예요.">
              <textarea rows={3} value={c.summary} maxLength={600} onChange={(e) => update(i, { summary: e.target.value })} data-testid="cast-summary" />
            </Field>
            <div className={styles.grid2}>
              <Field label="처음 있는 곳">
                <select value={c.startPlace} onChange={(e) => update(i, { startPlace: e.target.value })}>
                  <option value="">정하지 않음</option>
                  {placeNames.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </Field>
              <Field label="사는 곳">
                <select value={c.homePlace} onChange={(e) => update(i, { homePlace: e.target.value })}>
                  <option value="">정하지 않음</option>
                  {placeNames.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </Field>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MapTab({
  world,
  patch,
  version,
  selected,
  setSelected,
  onUpload,
  onRemove,
}: TabProps & {
  version: string;
  selected: string | null;
  setSelected: (n: string | null) => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const setPlaces = (places: Place[]) => patch({ places });
  const residents: Record<string, string[]> = {};
  for (const c of world.cast) if (c.homePlace) (residents[c.homePlace] ??= []).push(c.name);

  function addAt(x: number, y: number) {
    if (selected) {
      setPlaces(world.places.map((p) => (p.name === selected ? { ...p, x, y } : p)));
      return;
    }
    if (world.places.length >= 30) return;
    let n = world.places.length + 1;
    while (world.places.some((p) => p.name === `장소 ${n}`)) n++;
    setPlaces([...world.places, { name: `장소 ${n}`, x, y, note: "" }]);
  }

  return (
    <section className={styles.panel}>
      <p className={styles.lead}>
        지도나 공간 도표를 올리고, 지도를 눌러 장소 핀을 놓으세요. 목록에서 장소를 고른 채 지도를 누르면 그 핀을 옮겨요. 플레이 중에는 인물이 지금 있는 곳이 핀에 표시돼요.
      </p>
      <div className={styles.row}>
        <label className={styles.secondary}>
          {world.hasMap ? "지도 바꾸기" : "지도 그림 올리기"}
          <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} data-testid="map-upload" />
        </label>
        {world.hasMap && (
          <button type="button" className={styles.secondary} onClick={onRemove}>
            지도 지우기
          </button>
        )}
        {world.hasMap && world.mapReview !== "APPROVED" && <span className={styles.warn}>{REVIEW_TEXT[world.mapReview]}</span>}
        {selected && (
          <button type="button" className={styles.secondary} onClick={() => setSelected(null)}>
            「{selected}」 고르기 풀기
          </button>
        )}
      </div>
      <CopperMap worldId={world.id} hasMap={world.hasMap} places={world.places} residents={residents} onPick={addAt} selected={selected} onSelect={setSelected} version={version} />
      <ol className={styles.items}>
        {world.places.map((p, i) => (
          <li key={i} className={selected === p.name ? styles.itemOn : styles.item}>
            <div className={styles.grid3}>
              <Field label="장소 이름">
                <input
                  value={p.name}
                  maxLength={30}
                  onFocus={() => setSelected(p.name)}
                  onChange={(e) => {
                    const name = e.target.value;
                    // 이름을 바꾸면 이 장소를 가리키던 인물의 처음 있는 곳·사는 곳도 같이 바꾼다
                    patch({
                      places: world.places.map((x, j) => (j === i ? { ...x, name } : x)),
                      cast: world.cast.map((c) => ({ ...c, startPlace: c.startPlace === p.name ? name : c.startPlace, homePlace: c.homePlace === p.name ? name : c.homePlace })),
                    });
                    setSelected(name);
                  }}
                  data-testid="place-name"
                />
              </Field>
              <Field label="설명">
                <input value={p.note} maxLength={200} onChange={(e) => setPlaces(world.places.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
              </Field>
              <div className={styles.coords}>
                <span>
                  x {p.x} · y {p.y}
                </span>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() =>
                    patch({
                      places: world.places.filter((_, j) => j !== i),
                      cast: world.cast.map((c) => ({ ...c, startPlace: c.startPlace === p.name ? "" : c.startPlace, homePlace: c.homePlace === p.name ? "" : c.homePlace })),
                    })
                  }
                >
                  빼기
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PartsTab({ world, patch }: TabProps) {
  const setParts = (parts: PartEdit[]) => patch({ parts });
  const move = (i: number, d: number) => {
    const next = [...world.parts];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    setParts(next);
  };
  return (
    <section className={styles.panel}>
      <p className={styles.lead}>
        파트는 선택이에요. 파트가 있으면 이야기가 1부, 2부… 순서로 흐르고, 3턴마다 진행자가 아닌 판정 모델이 목표가 이루어졌는지 확인해 다음 파트로 넘어가요.
        목표는 플레이어에게 그대로 보이지 않고, 진행자는 그쪽으로 단서만 줘요.
      </p>
      <button type="button" className={styles.secondary} disabled={world.parts.length >= 12} onClick={() => setParts([...world.parts, { title: "", goal: "", opening: "" }])} data-testid="part-add">
        + 파트 더하기
      </button>
      <ol className={styles.items}>
        {world.parts.map((p, i) => (
          <li key={i} className={styles.item} data-testid="part-item">
            <div className={styles.itemHead}>
              <span className={styles.badge}>{i + 1}부</span>
              <span>
                <button type="button" className={styles.remove} disabled={i === 0} onClick={() => move(i, -1)} aria-label="위로">
                  ↑
                </button>
                <button type="button" className={styles.remove} disabled={i === world.parts.length - 1} onClick={() => move(i, 1)} aria-label="아래로">
                  ↓
                </button>
                <button type="button" className={styles.remove} onClick={() => setParts(world.parts.filter((_, j) => j !== i))}>
                  빼기
                </button>
              </span>
            </div>
            <Field label="제목">
              <input value={p.title} maxLength={40} onChange={(e) => setParts(world.parts.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} data-testid="part-title" />
            </Field>
            <Field label="끝나는 조건 (목표)" hint="대화 기록만 보고 예/아니오로 판정할 수 있게, 눈에 보이는 일로 써 주세요. 예: 주인공이 등대지기에게 배의 정체를 듣는다.">
              <textarea rows={2} value={p.goal} maxLength={600} onChange={(e) => setParts(world.parts.map((x, j) => (j === i ? { ...x, goal: e.target.value } : x)))} data-testid="part-goal" />
            </Field>
            <Field label="시작 글 (선택)">
              <textarea rows={2} value={p.opening} maxLength={600} onChange={(e) => setParts(world.parts.map((x, j) => (j === i ? { ...x, opening: e.target.value } : x)))} />
            </Field>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ImagesTab({
  world,
  dirty,
  busy,
  onUpload,
  onRemove,
}: {
  world: WorldEdit;
  dirty: boolean;
  busy: boolean;
  onUpload: (label: string, character: string, file: File) => Promise<boolean>;
  onRemove: (image: ImageMeta) => void;
}) {
  const [label, setLabel] = useState("");
  const [character, setCharacter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  return (
    <section className={styles.panel}>
      <p className={styles.lead}>
        장면 그림에 이름표를 붙여 올리면, 진행자가 지금 장면에 맞는 이름표를 골라 그 그림을 함께 보여 줘요(기본 채팅형·비주얼노벨형·소설형). 인물을 고르면 비주얼노벨에서 그
        인물이 말할 때 서 있는 그림으로 써요. 올린 그림은 자동 검수를 거치고, 애매하면 운영자가 확인한 뒤 나와요. 최대 40장, 한 장 290KB(큰 그림은 자동으로 줄여요).
      </p>
      {dirty && <p className={styles.warn}>등장인물을 바꿨다면 먼저 저장해야 인물을 고를 수 있어요.</p>}
      <div className={styles.row}>
        <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={30} placeholder="이름표 (예: 밤의 부두, 서린 웃음)" aria-label="그림 이름표" data-testid="image-label" />
        <select value={character} onChange={(e) => setCharacter(e.target.value)} aria-label="그림 속 인물">
          <option value="">장면 (인물 아님)</option>
          {world.cast.map((c) => (
            <option key={c.name}>{c.name}</option>
          ))}
        </select>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} data-testid="image-file" aria-label="그림 파일" />
        <button
          type="button"
          className={styles.primary}
          disabled={busy || !label.trim() || !file}
          onClick={async () => {
            if (file && (await onUpload(label.trim(), character, file))) {
              setLabel("");
              setFile(null);
            }
          }}
          data-testid="image-upload"
        >
          올리기
        </button>
      </div>
      <ul className={styles.gallery}>
        {world.images.map((img) => (
          <li key={img.id} className={styles.thumb}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 로그인 쿠키로 중계하는 그림 */}
            <img src={worldImageUrl(world.id, img.id)} alt={img.label} loading="lazy" />
            <strong>{img.label}</strong>
            {img.character && <span>{img.character}</span>}
            <span className={img.review === "APPROVED" && !img.blocked ? styles.okText : styles.warn}>
              {img.blocked ? "운영자가 막음" : REVIEW_TEXT[img.review]}
              {img.reviewNote ? ` — ${img.reviewNote}` : ""}
            </span>
            <button type="button" className={styles.remove} onClick={() => onRemove(img)}>
              지우기
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PublishTab({
  world,
  dirty,
  busy,
  publishAs,
  remove,
}: {
  world: WorldEdit;
  dirty: boolean;
  busy: boolean;
  publishAs: (v: Visibility | null) => void;
  remove: () => void;
}) {
  const [visibility, setVisibility] = useState<Visibility>(world.visibility === "PRIVATE" && !world.published ? "PUBLIC" : world.visibility);
  return (
    <section className={styles.panel}>
      {world.problems.length > 0 && !dirty && <p className={styles.warn}>발행하려면 채워야 해요: {world.problems.join(", ")}</p>}
      {dirty && <p className={styles.warn}>저장하지 않은 변경이 있어요. 발행하면 먼저 저장해요.</p>}
      <fieldset className={styles.modes}>
        <legend className={styles.label}>공개 범위</legend>
        {(Object.keys(VISIBILITY_LABELS) as Visibility[]).map((v) => (
          <label key={v} className={visibility === v ? styles.modeOn : styles.mode}>
            <input type="radio" name="visibility" checked={visibility === v} onChange={() => setVisibility(v)} />
            <strong>{VISIBILITY_LABELS[v].split(" — ")[0]}</strong>
            <span>{VISIBILITY_LABELS[v].split(" — ")[1]}</span>
          </label>
        ))}
      </fieldset>
      <div className={styles.row}>
        <button type="button" className={styles.primary} disabled={busy || world.takenDown} onClick={() => publishAs(visibility)} data-testid="world-publish">
          {world.published ? "공개 범위 바꾸기" : "발행하기"}
        </button>
        {world.published && (
          <button type="button" className={styles.secondary} disabled={busy} onClick={() => publishAs(null)}>
            발행 거두기
          </button>
        )}
        <button type="button" className={styles.danger} disabled={busy} onClick={remove}>
          세계관 지우기
        </button>
      </div>
      <p className={styles.hint}>
        공개한 세계관은 신고될 수 있고, 운영 정책에 맞지 않으면 운영자가 내릴 수 있어요. 성인 확인을 마친 플레이어에게만 성인 수위가 열리고, 미성년자·강제 단서가 있으면 그 장면은
        전체 이용가로 진행돼요.
      </p>
    </section>
  );
}
