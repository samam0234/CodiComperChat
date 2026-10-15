import { Injectable } from '@nestjs/common';
import { postToAi } from '../ai/ai-client.js';
import { buildSheet, draftSpec, normalizeDraft } from './draft-fields.js';
import { StudioService } from './studio.service.js';

// "이 칸만 AI로 초안" (기획서 §6.1). 제안만 돌려주고 카드는 건드리지 않는다 — 유저가 보고 적용을 누른다.
// 비밀·해금 조건은 설정 줄에 넣지 않으므로 FastAPI로 나가지 않는다 (§7.8)
@Injectable()
export class StudioDraftService {
  constructor(private readonly studio: StudioService) {}

  async draftField(ownerId: string, id: string, field: unknown) {
    const spec = draftSpec(field);
    const { card } = await this.studio.findOwned(ownerId, id);
    const current = spec.read(card);

    const raw = await postToAi<{ text: string; items: string[] }>('/draft-field', {
      sheet: buildSheet(card, spec.key),
      label: spec.label,
      guide: spec.guide,
      kind: spec.kind,
      maxChars: spec.max,
      maxItems: spec.maxItems,
      current: Array.isArray(current) ? current.join('\n') : current,
    });
    return { field: spec.key, kind: spec.kind, value: normalizeDraft(spec, raw) };
  }
}
