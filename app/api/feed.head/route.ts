export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getRepoFile } from '@/lib/github-files';
import { sha1 } from '@/lib/hash';

export async function GET() {
  const file = await getRepoFile('public/data/feed.json');
  const body = file.content || '';
  const etag = sha1(body);
  const res = new NextResponse(etag, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  res.headers.set('Cache-Control','public, max-age=0, s-maxage=60, stale-while-revalidate=120');
  return res;
}