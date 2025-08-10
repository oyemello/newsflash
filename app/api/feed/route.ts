export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getRepoFile } from '@/lib/github';
import { sha1 } from '@/lib/hash';

export async function GET() {
  try {
    const file = await getRepoFile('public/data/feed.json');
    const body = file.content || JSON.stringify({ version: '0', generatedAt: null, items: [] });
    const etag = sha1(body);
    const res = new NextResponse(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
    res.headers.set('ETag', etag);
    res.headers.set('Cache-Control','public, max-age=0, s-maxage=60, stale-while-revalidate=120');
    return res;
  } catch {
    const fallback = JSON.stringify({ version: '0', generatedAt: null, items: [] });
    const res = new NextResponse(fallback, { status: 200, headers: { 'Content-Type': 'application/json' } });
    res.headers.set('ETag', sha1(fallback));
    return res;
  }
}