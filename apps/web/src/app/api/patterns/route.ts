import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import type { Pattern } from '@prisma/client';

const createSchema = z.object({
  name: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  liveCells: z.array(z.tuple([z.number(), z.number()])),
});

function toResponse(row: Pattern) {
  return {
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    liveCells: JSON.parse(row.liveCells) as [number, number][],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  const rows = await prisma.pattern.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows.map(toResponse));
}

export async function POST(req: Request) {
  const body = createSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }
  const { name, width, height, liveCells } = body.data;
  const row = await prisma.pattern.create({
    data: { name, width, height, liveCells: JSON.stringify(liveCells) },
  });
  return NextResponse.json(toResponse(row), { status: 201 });
}
