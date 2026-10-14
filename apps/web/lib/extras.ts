// 엑스트라(유저가 만든 조연)의 웹 쪽 모양. 정본 검증·등장 판정은 Nest(apps/api/src/extras)가 한다

export type Trigger = "relation" | "situation" | "place";

export const TRIGGER_OPTIONS: { value: Trigger; label: string; field: keyof ExtraFields }[] = [
  { value: "relation", label: "인물 관계", field: "relation" },
  { value: "situation", label: "상황", field: "situation" },
  { value: "place", label: "장소", field: "place" },
];

export type ExtraFields = {
  name: string;
  summary: string;
  personality: string;
  relation: string;
  situation: string;
  place: string;
};

export type Extra = ExtraFields & {
  id: string;
  updatedAt: string;
  // 이 캐릭터와의 대화에서 조건별로 등장을 부르는 단어 (서버가 뽑는다)
  keywords: Record<Trigger, string[]>;
};

export type ExtrasView = {
  limits: Record<keyof ExtraFields, number> & { perUser: number; perConversation: number };
  mine: Extra[];
  applied: { extraId: string; triggers: Trigger[] }[];
};

export const EMPTY_EXTRA: ExtraFields = { name: "", summary: "", personality: "", relation: "", situation: "", place: "" };
