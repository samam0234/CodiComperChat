import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parsePersonaKnowledge } from './persona-knowledge.types.js';

// 저장소에 올라간 형식 예시. 문서(README)와 검증기가 어긋나지 않는지 테스트가 이 파일로 확인한다
export const EXAMPLE_PATH = fileURLToPath(new URL('../../data/personas/_example.json', import.meta.url));

export const readExampleRaw = () => JSON.parse(readFileSync(EXAMPLE_PATH, 'utf8'));

export const example = () => parsePersonaKnowledge(readExampleRaw(), '_example.json');
