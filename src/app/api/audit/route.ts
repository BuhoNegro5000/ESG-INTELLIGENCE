import { NextResponse } from 'next/server';
import { getAuditTrail } from '@/lib/db';

export async function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get('limit') || 100);
  return NextResponse.json({ logs: getAuditTrail(Math.min(500, Math.max(1, limit))) });
}
