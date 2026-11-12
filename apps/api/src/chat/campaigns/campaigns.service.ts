import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class CampaignsService {
  create(): never {
    throw new NotImplementedException(
      '캠페인 생성은 아직 구현되지 않았다 (Prisma 스키마 이후, 기획서 10장 2~3번)',
    );
  }

  findOne(campaignId: string): never {
    throw new NotImplementedException(
      `캠페인 조회는 아직 구현되지 않았다 (요청 id: ${campaignId})`,
    );
  }

  openSession(campaignId: string): never {
    throw new NotImplementedException(
      `세션 열기는 아직 구현되지 않았다 (요청 캠페인: ${campaignId})`,
    );
  }

  sendMessage(campaignId: string): never {
    throw new NotImplementedException(
      `메시지 전송은 아직 구현되지 않았다. 컨텍스트 조립과 FastAPI /infer 스트림 중계가 여기 들어간다 (기획서 7.6장, 요청 캠페인: ${campaignId})`,
    );
  }

  closeSession(campaignId: string, sessionId: string): never {
    throw new NotImplementedException(
      `세션 종료·요약은 아직 구현되지 않았다. FastAPI /summarize 결과를 CampaignState에 머지하는 자리다 (기획서 13.4장, 요청: ${campaignId}/${sessionId})`,
    );
  }

  findLogbook(campaignId: string): never {
    throw new NotImplementedException(
      `로그북 조회는 아직 구현되지 않았다 (요청 캠페인: ${campaignId})`,
    );
  }
}
