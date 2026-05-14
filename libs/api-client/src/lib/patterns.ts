import { z } from 'zod';
import type { SavedPattern } from '@conways-game-of-life/types';

const API_BASE = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3333';

const savedPatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  liveCells: z.array(z.tuple([z.number(), z.number()])),
  createdAt: z.string(),
});

const savedPatternArraySchema = z.array(savedPatternSchema);

export async function listPatterns(): Promise<SavedPattern[]> {
  const res = await fetch(`${API_BASE}/patterns`);
  if (!res.ok) throw new Error(`listPatterns: ${res.status}`);
  return savedPatternArraySchema.parse(await res.json()) as SavedPattern[];
}

export async function getPattern(id: string): Promise<SavedPattern | null> {
  const res = await fetch(`${API_BASE}/patterns/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getPattern: ${res.status}`);
  return savedPatternSchema.parse(await res.json()) as SavedPattern;
}

export async function savePattern(
  input: Omit<SavedPattern, 'id' | 'createdAt'>,
): Promise<SavedPattern> {
  const res = await fetch(`${API_BASE}/patterns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`savePattern: ${res.status}`);
  return savedPatternSchema.parse(await res.json()) as SavedPattern;
}
