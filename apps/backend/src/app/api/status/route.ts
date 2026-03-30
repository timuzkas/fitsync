import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Basic connectivity check
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ status: 'error', database: 'disconnected' }, { status: 500 });
  }
}
