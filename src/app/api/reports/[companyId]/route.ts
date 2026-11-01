import { NextResponse } from 'next/server';
import { getReportData } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const data = getReportData(companyId);
  if (!data) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  return NextResponse.json(data);
}
