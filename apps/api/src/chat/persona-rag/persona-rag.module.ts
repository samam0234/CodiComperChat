import { Module } from '@nestjs/common';
import { PersonaKnowledgeStore } from './persona-knowledge.store.js';
import { PersonaRagService } from './persona-rag.service.js';

@Module({
  providers: [PersonaKnowledgeStore, PersonaRagService],
  exports: [PersonaRagService, PersonaKnowledgeStore],
})
export class PersonaRagModule {}
