import { Body, Controller, Get, HttpCode, Inject, NotFoundException, Param, Post } from '@nestjs/common';
import type { PatternRepository } from '@conways-game-of-life/types';
import { PATTERN_REPOSITORY } from './pattern-repository.token.js';
import { CreatePatternDto } from './dto/create-pattern.dto.js';

@Controller('patterns')
export class PatternsController {
  constructor(
    @Inject(PATTERN_REPOSITORY) private readonly repo: PatternRepository,
  ) {}

  @Get()
  list() {
    return this.repo.list();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const pattern = await this.repo.get(id);
    if (!pattern) throw new NotFoundException();
    return pattern;
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePatternDto) {
    return this.repo.create(dto);
  }
}
