import { buildFeedJson } from '../lib/news';
import { Item } from '../lib/news';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()\[\]"'’“”|<>?]/g, "")
    .replace(/\s+/g, " ");
}

function dedupeByTitleAndURL(items: Item[]): Item[] {
  const seen = new Set<string>();
  let kept: Item[] = [];
  for (const i of items) {
    const key = normalizeTitle(i.title || '').slice(0, 140) + '|' + (i.url || '');
    if (seen.has(key)) continue;
    seen.add(key); kept.push(i);
  }
  return kept;
}

function simpleLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const dp = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

function dedupeBySimilarity(items: Item[]): Item[] {
  const kept: Item[] = [];
  for (const i of items) {
    const normTitle = normalizeTitle(i.title || '');
    const domain = (i.url || '').split('/')[2] || '';
    if (kept.some(k => {
      const kDomain = (k.url || '').split('/')[2] || '';
      const kNormTitle = normalizeTitle(k.title || '');
      return domain === kDomain && (kNormTitle.includes(normTitle) || normTitle.includes(kNormTitle) || simpleLevenshtein(kNormTitle, normTitle) <= 6);
    })) continue;
    kept.push(i);
  }
  return kept;
}

async function main() {
  const feedStr = await buildFeedJson();
  const feed = JSON.parse(feedStr);
  const originalCount = feed.items.length;
  let deduped = dedupeByTitleAndURL(feed.items);
  deduped = dedupeBySimilarity(deduped);
  const dedupedCount = deduped.length;
  console.log("DEDUPE removed", originalCount - dedupedCount);
  feed.items = deduped;
  const feedPath = join(__dirname, '../public/data/feed.json');
  writeFileSync(feedPath, JSON.stringify(feed, null, 2));

  const now = new Date();
  const utc = {
    year: now.getUTCFullYear(),
    month: String(now.getUTCMonth() + 1).padStart(2, '0'),
    day: String(now.getUTCDate()).padStart(2, '0'),
    hour: String(now.getUTCHours()).padStart(2, '0'),
    minute: now.getUTCMinutes()
  };

  if (utc.minute === 0) {
    const archiveDir = join(__dirname, `../public/archive/${utc.year}/${utc.month}/${utc.day}`);
    if (!existsSync(archiveDir)) mkdirSync(archiveDir, { recursive: true });
    const archivePath = join(archiveDir, `${utc.hour}.json`);
    writeFileSync(archivePath, JSON.stringify(feed, null, 2));
  }
}

main();
