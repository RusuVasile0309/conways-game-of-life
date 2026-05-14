import { InMemoryPatternRepository } from './in-memory.repository.js';

describe('InMemoryPatternRepository', () => {
  let repo: InMemoryPatternRepository;

  beforeEach(() => {
    repo = new InMemoryPatternRepository();
  });

  describe('list()', () => {
    it('returns empty array when no patterns exist', async () => {
      expect(await repo.list()).toEqual([]);
    });

    it('returns all created patterns', async () => {
      await repo.create({ name: 'A', width: 10, height: 10, liveCells: [[0, 0]] });
      await repo.create({ name: 'B', width: 20, height: 20, liveCells: [] });
      const list = await repo.list();
      expect(list).toHaveLength(2);
      expect(list.map((p) => p.name)).toEqual(expect.arrayContaining(['A', 'B']));
    });
  });

  describe('create()', () => {
    it('returns the saved pattern with a UUID id and ISO createdAt', async () => {
      const result = await repo.create({ name: 'Glider', width: 5, height: 5, liveCells: [[1, 0]] });
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.name).toBe('Glider');
      expect(result.width).toBe(5);
      expect(result.height).toBe(5);
      expect(result.liveCells).toEqual([[1, 0]]);
      expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt);
    });

    it('assigns unique ids to each created pattern', async () => {
      const a = await repo.create({ name: 'A', width: 5, height: 5, liveCells: [] });
      const b = await repo.create({ name: 'B', width: 5, height: 5, liveCells: [] });
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('get()', () => {
    it('returns the pattern by id', async () => {
      const created = await repo.create({ name: 'Blinker', width: 5, height: 5, liveCells: [] });
      const found = await repo.get(created.id);
      expect(found).toEqual(created);
    });

    it('returns null for a non-existent id', async () => {
      expect(await repo.get('nonexistent-id')).toBeNull();
    });
  });
});
