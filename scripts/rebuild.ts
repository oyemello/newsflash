import { buildFeedJson } from '../lib/news';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

async function main() {
  const feed = await buildFeedJson();
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
