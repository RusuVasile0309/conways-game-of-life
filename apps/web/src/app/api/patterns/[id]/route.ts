import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await prisma.pattern.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    liveCells: JSON.parse(row.liveCells) as [number, number][],
    createdAt: row.createdAt.toISOString(),
  });
}
