// FastAPI /infer/stream 이 줄마다 보내는 JSON

export type StreamLine =
  | { delta: string }
  | { done: true; reply: string }
  | { error: string; status?: number };

export function pushNdjson(buffer: string, chunk: string, onLine: (line: string) => void): string {
  const lines = (buffer + chunk).split('\n');
  const rest = lines.pop() ?? '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) onLine(trimmed);
  }
  return rest;
}

export function readStreamLine(line: string): StreamLine {
  const data = JSON.parse(line) as StreamLine;
  if (!data || typeof data !== 'object') throw new Error('스트림 줄이 잘못됐다');
  return data;
}
