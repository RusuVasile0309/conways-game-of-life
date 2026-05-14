import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PatternsController } from './patterns.controller.js';
import { PATTERN_REPOSITORY } from './pattern-repository.token.js';
import type { PatternRepository, SavedPattern } from '@conways-game-of-life/types';

const mockPattern: SavedPattern = {
  id: 'abc-123',
  name: 'Glider',
  width: 5,
  height: 5,
  liveCells: [[1, 0]],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('PatternsController', () => {
  let controller: PatternsController;
  let repo: jest.Mocked<PatternRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PatternsController],
      providers: [
        {
          provide: PATTERN_REPOSITORY,
          useValue: {
            list: jest.fn(),
            get: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(PatternsController);
    repo = module.get<jest.Mocked<PatternRepository>>(PATTERN_REPOSITORY);
  });

  describe('list()', () => {
    it('delegates to repo.list() and returns the result', async () => {
      repo.list.mockResolvedValue([mockPattern]);
      expect(await controller.list()).toEqual([mockPattern]);
      expect(repo.list).toHaveBeenCalledTimes(1);
    });
  });

  describe('get()', () => {
    it('returns the pattern when found', async () => {
      repo.get.mockResolvedValue(mockPattern);
      expect(await controller.get('abc-123')).toEqual(mockPattern);
    });

    it('throws NotFoundException when pattern not found', async () => {
      repo.get.mockResolvedValue(null);
      await expect(controller.get('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create()', () => {
    it('delegates to repo.create() and returns the saved pattern', async () => {
      repo.create.mockResolvedValue(mockPattern);
      const dto = { name: 'Glider', width: 5, height: 5, liveCells: [[1, 0]] as [number, number][] };
      expect(await controller.create(dto)).toEqual(mockPattern);
      expect(repo.create).toHaveBeenCalledWith(dto);
    });
  });
});
