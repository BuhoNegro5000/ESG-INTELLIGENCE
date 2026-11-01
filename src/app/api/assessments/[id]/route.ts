import { NextResponse } from 'next/server';
import { z } from 'zod';
import { advanceAssessment } from '@/lib/db';

const schema = z.object({
  stage: z.number().int().min(1).max(9),
  status: z.enum(['Draft', 'In review', 'Approved', 'Published']).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const result = advanceAssessment(id, parsed.data.stage, parsed.data.status);
  if (!result.ok) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  return NextResponse.json(result);
}
