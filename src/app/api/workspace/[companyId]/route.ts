import { NextResponse } from 'next/server';
import { getWorkspace } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const workspace = getWorkspace(companyId);
  if (!workspace) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  return NextResponse.json(workspace);
}
