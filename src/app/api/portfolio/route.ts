import { NextResponse } from 'next/server';
import { getPortfolio } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getPortfolio());
}
