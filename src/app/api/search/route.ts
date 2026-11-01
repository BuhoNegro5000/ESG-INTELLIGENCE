import { NextResponse } from 'next/server';
import { searchAll } from '@/lib/db';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') || '';
  return NextResponse.json({ results: searchAll(q) });
}
