import { listPatterns, getPattern, savePattern } from './patterns.js';
import type { SavedPattern } from '@conways-game-of-life/types';

const mockPattern: SavedPattern = {
  id: 'abc-123',
  name: 'Glider',
  width: 5,
  height: 5,
  liveCells: [[1, 0]],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockFetch = jest.fn();
(global as unknown as { fetch: jest.Mock }).fetch = mockFetch;

beforeEach(() => mockFetch.mockReset());

describe('listPatterns()', () => {
  it('returns parsed array on 200', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockPattern],
    });
    const result = await listPatterns();
    expect(result).toEqual([mockPattern]);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/patterns'));
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(listPatterns()).rejects.toThrow('500');
  });

  it('propagates network errors (fetch rejection)', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(listPatterns()).rejects.toThrow('fetch failed');
  });

  it('throws zod error on malformed response shape', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 42 }], // id must be string
    });
    await expect(listPatterns()).rejects.toThrow();
  });
});

describe('getPattern()', () => {
  it('returns pattern on 200', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPattern,
    });
    const result = await getPattern('abc-123');
    expect(result).toEqual(mockPattern);
  });

  it('returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    expect(await getPattern('nonexistent')).toBeNull();
  });

  it('throws on non-404 error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(getPattern('abc')).rejects.toThrow('500');
  });
});

describe('savePattern()', () => {
  it('returns created pattern on 201', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPattern,
    });
    const input = { name: 'Glider', width: 5, height: 5, liveCells: [[1, 0]] as [number, number][] };
    const result = await savePattern(input);
    expect(result).toEqual(mockPattern);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/patterns'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });
    const input = { name: 'X', width: 5, height: 5, liveCells: [] as [number, number][] };
    await expect(savePattern(input)).rejects.toThrow('400');
  });
});
