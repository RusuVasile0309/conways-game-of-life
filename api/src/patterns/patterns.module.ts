import { Module } from '@nestjs/common';
import { PATTERN_REPOSITORY } from './pattern-repository.token.js';
import { SqlitePatternRepository } from './prisma.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PatternsController } from './patterns.controller.js';

@Module({
  providers: [
    PrismaService,
    SqlitePatternRepository,
    { provide: PATTERN_REPOSITORY, useExisting: SqlitePatternRepository },
  ],
  controllers: [PatternsController],
})
export class PatternsModule {}
