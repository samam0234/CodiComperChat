import { Controller, Get, Param } from '@nestjs/common';
import { CharactersService } from './characters.service.js';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  findPublished() {
    return this.charactersService.findPublished();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.charactersService.findOnePublished(id);
  }
}
