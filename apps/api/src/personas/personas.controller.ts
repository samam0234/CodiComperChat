import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { PersonasService, parsePersona } from './personas.service.js';

@Controller('me/personas')
@UseGuards(AuthGuard)
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.personasService.list(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.personasService.create(userId, parsePersona(body));
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.personasService.update(userId, id, parsePersona(body));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    await this.personasService.remove(userId, id);
  }
}
