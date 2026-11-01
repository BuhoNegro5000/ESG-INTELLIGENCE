import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createIRO } from '@/lib/db';

const schema = z.object({
  companyId: z.string().min(1),
  topicCode: z.string().min(1),
  title: z.string().min(3),
  type: z.enum(['Impact', 'Risk', 'Opportunity']),
  nature: z.string().optional(),
  actuality: z.string().optional(),
  stage: z.string().optional(),
  description: z.string().min(5),
  consequence: z.string().optional(),
  cause: z.string().optional(),
  impactScore: z.number().min(0).max(5),
  financialScore: z.number().min(0).max(5),
  critical: z.boolean().optional(),
  owner: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }
  const iro = createIRO(parsed.data);
  if (!iro) return NextResponse.json({ error: 'Could not create IRO' }, { status: 400 });
  return NextResponse.json(iro, { status: 201 });
}
