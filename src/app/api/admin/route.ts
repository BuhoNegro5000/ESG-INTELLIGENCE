import { NextResponse } from 'next/server';
import { getAdminData } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getAdminData());
}
