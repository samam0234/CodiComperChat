import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export type AgentChatReply = {
  reply: string;
};

@Injectable()
export class AgentChatService {
  // 호스티드 LLM 벤더가 정해지면 여기서 services/ai를 호출한다 (계획서 §15 열린 항목).
  // 웹이 FastAPI를 직접 부르지 않도록 중계 지점만 먼저 열어 둔다 (계획서 §7.1).
  send(_message: string): AgentChatReply {
    throw new ServiceUnavailableException(
      '아직 연결된 LLM이 없어 답변을 만들 수 없습니다. 호스티드 LLM 벤더가 정해지면 이 자리에서 services/ai로 중계합니다 (기획서 15장 열린 항목).',
    );
  }
}
