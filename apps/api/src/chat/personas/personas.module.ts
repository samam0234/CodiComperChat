import { Module } from '@nestjs/common';
import { AuthModule } from '../../account/auth/auth.module.js';
import { PersonasController } from './personas.controller.js';
import { PersonasService } from './personas.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PersonasController],
  providers: [PersonasService],
  exports: [PersonasService],
})
export class PersonasModule {}
