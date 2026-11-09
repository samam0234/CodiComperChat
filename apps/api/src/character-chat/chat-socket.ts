import { HttpException } from '@nestjs/common';
import type { Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { CharacterChatService, type LiveListener } from './character-chat.service.js';

function errorMessage(error: unknown): string {
  if (error instanceof HttpException) {
    const body = error.getResponse();
    if (typeof body === 'string') return body;
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message: unknown }).message;
      return Array.isArray(message) ? message.join(' ') : String(message);
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return '답을 만들지 못했어요. 잠시 뒤에 다시 시도해 주세요.';
}

function send(socket: WebSocket, payload: unknown) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(payload));
}

// 브라우저가 표를 들고 붙는 대화 소켓. 추론을 나누지 않고, 로컬 모델이 만든 조각을 그대로 넘긴다
export function attachChatSocket(server: Server, chat: CharacterChatService) {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });
  wss.on('connection', (socket) => {
    let started = false;
    const abort = new AbortController();
    socket.on('close', () => abort.abort());
    socket.on('message', (raw) => {
      if (started) return;
      started = true;
      let ticket = '';
      try {
        const body = JSON.parse(String(raw)) as { ticket?: unknown };
        ticket = typeof body.ticket === 'string' ? body.ticket : '';
      } catch {
        ticket = '';
      }
      if (!ticket) {
        send(socket, { type: 'error', message: '대화 연결이 없어요. 다시 보내 주세요.' });
        socket.close();
        return;
      }
      const live: LiveListener = {
        signal: abort.signal,
        delta: (text) => send(socket, { type: 'delta', text }),
        replace: (text) => send(socket, { type: 'replace', text }),
      };
      void chat
        .playLive(ticket, live)
        .then((done) => {
          send(socket, { type: 'done', ...done });
          socket.close();
        })
        .catch((error: unknown) => {
          if (abort.signal.aborted) {
            socket.close();
            return;
          }
          send(socket, { type: 'error', message: errorMessage(error) });
          socket.close();
        });
    });
  });
  return wss;
}
