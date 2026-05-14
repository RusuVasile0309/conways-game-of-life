import { Module } from '@nestjs/common';
import { InMemoryPatternRepository } from './in-memory.repository.js';
import { PatternsController } from './patterns.controller.js';

@Module({
  providers: [InMemoryPatternRepository],
  controllers: [PatternsController],
})
export class PatternsModule {}
