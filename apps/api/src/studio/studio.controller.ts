import { Controller, Param, Patch, Post } from '@nestjs/common';
import { StudioService } from './studio.service.js';

@Controller('studio/characters')
export class StudioController {
  constructor(private readonly studioService: StudioService) {}

  @Post()
  createDraft() {
    return this.studioService.createDraft();
  }

  @Patch(':id')
  updateDraft(@Param('id') id: string) {
    return this.studioService.updateDraft(id);
  }

  @Post(':id/test')
  test(@Param('id') id: string) {
    return this.studioService.test(id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.studioService.publish(id);
  }
}
