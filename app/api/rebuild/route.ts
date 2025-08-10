export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { buildFeedJson } from '@/lib/news';
import { getRepoFile, upsertFile } from '@/lib/github-files';
import { sha1 } from '@/lib/hash';

export async function GET() {
  // 1) Build feed
  const data = await buildFeedJson();
  const hash = sha1(data);

  // 2) Skip if unchanged
  const current = await getRepoFile('public/data/feed.json');
  const currentHash = current.content ? sha1(current.content) : null;
  if (currentHash === hash) {
    const res = NextResponse.json({ ok: true, skipped: true, reason: 'no-change' });
    res.headers.set('Cache-Control','public, max-age=0, s-maxage=60, stale-while-revalidate=120');
    return res;
  }

  // 3) Update latest
  const stamp = new Date().toISOString().replace(/:/g,'-').replace(/\..+/, 'Z');
  await upsertFile('public/data/feed.json', data, `chore: update feed ${stamp}`, current.sha);

  // 4) Hourly archive (UTC minute === 0)
  const ts = new Date();
  if (ts.getUTCMinutes() === 0) {
    const archivePath =
      `public/archive/${ts.getUTCFullYear()}/` +
      `${String(ts.getUTCMonth()+1).padStart(2,'0')}/` +
      `${String(ts.getUTCDate()).padStart(2,'0')}/` +
      `${String(ts.getUTCHours()).padStart(2,'0')}.json`;
    await upsertFile(archivePath, data, `chore: archive hourly ${stamp}`);
  }

  const res = NextResponse.json({ ok: true, updated: true });
  res.headers.set('Cache-Control','public, max-age=0, s-maxage=60, stale-while-revalidate=120');
  return res;
}