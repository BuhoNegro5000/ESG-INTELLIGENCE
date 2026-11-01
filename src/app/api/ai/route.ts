import { NextResponse } from 'next/server';
import { z } from 'zod';
import { askAI } from '@/lib/db';

const schema = z.object({
  companyId: z.string().min(1),
  prompt: z.string().min(2),
  agent: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  return NextResponse.json(askAI(parsed.data.companyId, parsed.data.prompt, parsed.data.agent));
}
