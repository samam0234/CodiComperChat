import { Controller, Get, Param, Post } from '@nestjs/common';
import { CampaignsService } from './campaigns.service.js';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create() {
    return this.campaignsService.create();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Post(':id/sessions')
  openSession(@Param('id') id: string) {
    return this.campaignsService.openSession(id);
  }

  @Post(':id/messages')
  sendMessage(@Param('id') id: string) {
    return this.campaignsService.sendMessage(id);
  }

  @Post(':id/sessions/:sessionId/close')
  closeSession(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.campaignsService.closeSession(id, sessionId);
  }

  @Get(':id/logbook')
  findLogbook(@Param('id') id: string) {
    return this.campaignsService.findLogbook(id);
  }
}
