import type { Pattern } from '@prisma/client';
import type { PatternRepository, SavedPattern } from '@conways-game-of-life/types';
import { PrismaPatternRepository } from './prisma.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

const makeRow = (overrides: Partial<Pattern> = {}): Pattern => ({
  id: 'abc-123',
  name: 'Glider',
  width: 5,
  height: 5,
  liveCells: '[[1,0],[2,1],[0,2],[1,2],[2,2]]',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const makePrisma = () =>
  ({
    pattern: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as PrismaService);

describe('PrismaPatternRepository', () => {
  let repo: PatternRepository;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PrismaPatternRepository(prisma);
  });

  describe('list()', () => {
    it('returns empty array when findMany returns []', async () => {
      (prisma.pattern.findMany as jest.Mock).mockResolvedValue([]);
      expect(await repo.list()).toEqual([]);
    });

    it('maps Prisma rows to SavedPattern with parsed liveCells and ISO createdAt', async () => {
      const row = makeRow();
      (prisma.pattern.findMany as jest.Mock).mockResolvedValue([row]);
      const result = await repo.list();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual<SavedPattern>({
        id: 'abc-123',
        name: 'Glider',
        width: 5,
        height: 5,
        liveCells: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('queries with orderBy createdAt desc', async () => {
      (prisma.pattern.findMany as jest.Mock).mockResolvedValue([]);
      await repo.list();
      expect(prisma.pattern.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
    });

    it('returns multiple patterns in the order returned by Prisma', async () => {
      const rowA = makeRow({ id: 'a', name: 'A' });
      const rowB = makeRow({ id: 'b', name: 'B' });
      (prisma.pattern.findMany as jest.Mock).mockResolvedValue([rowA, rowB]);
      const result = await repo.list();
      expect(result.map((p) => p.id)).toEqual(['a', 'b']);
    });
  });

  describe('get(id)', () => {
    it('returns mapped SavedPattern when row is found', async () => {
      const row = makeRow();
      (prisma.pattern.findUnique as jest.Mock).mockResolvedValue(row);
      const result = await repo.get('abc-123');
      expect(result).toEqual<SavedPattern>({
        id: 'abc-123',
        name: 'Glider',
        width: 5,
        height: 5,
        liveCells: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('returns null when findUnique returns null', async () => {
      (prisma.pattern.findUnique as jest.Mock).mockResolvedValue(null);
      expect(await repo.get('missing')).toBeNull();
    });

    it('queries with correct where clause', async () => {
      (prisma.pattern.findUnique as jest.Mock).mockResolvedValue(null);
      await repo.get('my-id');
      expect(prisma.pattern.findUnique).toHaveBeenCalledWith({ where: { id: 'my-id' } });
    });
  });

  describe('create(input)', () => {
    it('JSON-stringifies liveCells when calling prisma.pattern.create', async () => {
      const row = makeRow({ liveCells: '[[1,0]]' });
      (prisma.pattern.create as jest.Mock).mockResolvedValue(row);
      await repo.create({ name: 'Glider', width: 5, height: 5, liveCells: [[1, 0]] });
      expect(prisma.pattern.create).toHaveBeenCalledWith({
        data: {
          name: 'Glider',
          width: 5,
          height: 5,
          liveCells: '[[1,0]]',
        },
      });
    });

    it('returns mapped SavedPattern with parsed liveCells', async () => {
      const row = makeRow({ liveCells: '[[1,0]]' });
      (prisma.pattern.create as jest.Mock).mockResolvedValue(row);
      const result = await repo.create({ name: 'Glider', width: 5, height: 5, liveCells: [[1, 0]] });
      expect(result.liveCells).toEqual([[1, 0]]);
      expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
    });

    it('handles empty liveCells array', async () => {
      const row = makeRow({ liveCells: '[]' });
      (prisma.pattern.create as jest.Mock).mockResolvedValue(row);
      const result = await repo.create({ name: 'Empty', width: 10, height: 10, liveCells: [] });
      expect(prisma.pattern.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ liveCells: '[]' }) }),
      );
      expect(result.liveCells).toEqual([]);
    });
  });
});
