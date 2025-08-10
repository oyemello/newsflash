export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { buildFeedJson } from '@/lib/news';
import { getRepoFile, upsertFile } from '@/lib/github';

export async function GET(req: Request) {
  try {
    // 1. Parse dry run param
    const url = new URL(req.url);
    const dry = url.searchParams.get('dry') === '1';

    // 2. Generate feed JSON
    const feedStr = await buildFeedJson();

    // 3. Dry run: just return size
    if (dry) {
      return NextResponse.json({ ok: true, dry: true, bytes: feedStr.length }, { status: 200 });
    }

    // 4. Commit to GitHub
    // Get current file SHA (if exists)
    let sha: string | undefined = undefined;
    try {
      const file = await getRepoFile('public/data/feed.json');
      sha = file.sha;
    } catch (e: any) {
      // If error, assume file does not exist (sha stays undefined)
      sha = undefined;
    }

    // Commit new content (create if sha is undefined, update if sha exists)
    try {
      await upsertFile(
        'public/data/feed.json',
        feedStr,
        `Update feed.json at ${new Date().toISOString()}`,
        sha
      );
    } catch (e: any) {
      // Log error with status and message
      const status = e?.status || e?.response?.status;
      const message = e?.message || e?.response?.data?.message || 'Unknown error';
      console.error('GitHub error:', status, message);
      return NextResponse.json({ ok: false, error: `[${status}] ${message}` }, { status: 500 });
    }

    // 5. Success response
    return NextResponse.json({ ok: true, updated: true }, { status: 200 });
  } catch (e: any) {
    // General error
    const status = e?.status || e?.response?.status;
    const message = e?.message || e?.response?.data?.message || 'Unknown error';
    console.error('REBUILD ERROR:', status, message);
    return NextResponse.json({ ok: false, error: `[${status}] ${message}` }, { status: 500 });
  }
}

/*
Test Plan:

1. Run the server:
   npm run dev

2. Test dry run (should NOT write to GitHub):
   curl -s "http://localhost:3000/api/rebuild?dry=1" | jq

3. Test real run (should write to GitHub):
   curl -s http://localhost:3000/api/rebuild | jq

4. Verify the file on GitHub:
   https://github.com/oyemello/newsflash/tree/main/public/data

5. Test the read endpoints:
   curl -s http://localhost:3000/api/feed.head
   curl -s http://localhost:3000/api/feed | jq

6. Open http://localhost:3000 to view the UI
*/