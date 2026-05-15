import { Module } from '@nestjs/common';
import { PATTERN_REPOSITORY } from './pattern-repository.token.js';
import { PrismaPatternRepository } from './prisma.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PatternsController } from './patterns.controller.js';

@Module({
  providers: [
    PrismaService,
    PrismaPatternRepository,
    { provide: PATTERN_REPOSITORY, useExisting: PrismaPatternRepository },
  ],
  controllers: [PatternsController],
})
export class PatternsModule {}
