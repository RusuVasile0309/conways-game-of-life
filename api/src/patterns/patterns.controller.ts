import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post } from '@nestjs/common';
import { InMemoryPatternRepository } from './in-memory.repository.js';
import { CreatePatternDto } from './dto/create-pattern.dto.js';

@Controller('patterns')
export class PatternsController {
  constructor(private readonly repo: InMemoryPatternRepository) {}

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
