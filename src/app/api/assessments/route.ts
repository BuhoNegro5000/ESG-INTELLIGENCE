import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAssessmentVersion } from '@/lib/db';

const schema = z.object({ companyId: z.string().min(1) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const result = createAssessmentVersion(parsed.data.companyId);
  if (!result) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  return NextResponse.json(result, { status: 201 });
}
