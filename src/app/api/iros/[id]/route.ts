import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateIRO } from '@/lib/db';

const schema = z.object({
  impactScore: z.number().min(0).max(5).optional(),
  financialScore: z.number().min(0).max(5).optional(),
  status: z.string().optional(),
  critical: z.boolean().optional(),
  scale: z.number().min(1).max(5).optional(),
  scope: z.number().min(1).max(5).optional(),
  irremediability: z.number().min(1).max(5).optional(),
  likelihood: z.number().min(1).max(5).optional(),
  financialLikelihood: z.number().min(1).max(5).optional(),
  financialMagnitude: z.number().min(1).max(5).optional(),
  owner: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  const iro = updateIRO(id, parsed.data);
  if (!iro) return NextResponse.json({ error: 'IRO not found' }, { status: 404 });
  return NextResponse.json(iro);
}
