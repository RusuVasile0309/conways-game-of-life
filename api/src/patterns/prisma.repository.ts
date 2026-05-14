import { Injectable } from '@nestjs/common';
import type { Pattern } from '@prisma/client';
import type { PatternRepository, SavedPattern } from '@conways-game-of-life/types';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SqlitePatternRepository implements PatternRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toSavedPattern(row: Pattern): SavedPattern {
    return {
      id: row.id,
      name: row.name,
      width: row.width,
      height: row.height,
      liveCells: JSON.parse(row.liveCells) as [number, number][],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(): Promise<SavedPattern[]> {
    const rows = await this.prisma.pattern.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => this.toSavedPattern(r));
  }

  async get(id: string): Promise<SavedPattern | null> {
    const row = await this.prisma.pattern.findUnique({ where: { id } });
    return row ? this.toSavedPattern(row) : null;
  }

  async create(input: Omit<SavedPattern, 'id' | 'createdAt'>): Promise<SavedPattern> {
    const row = await this.prisma.pattern.create({
      data: {
        name: input.name,
        width: input.width,
        height: input.height,
        liveCells: JSON.stringify(input.liveCells),
      },
    });
    return this.toSavedPattern(row);
  }
}
