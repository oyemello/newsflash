import { buildFeedJson } from '../lib/news';
import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  const feedStr = await buildFeedJson();
  const feedBytes = Buffer.byteLength(feedStr, 'utf8');
  const feedPath = path.join(__dirname, '../public/data/feed.json');
  await fs.mkdir(path.dirname(feedPath), { recursive: true });
  await fs.writeFile(feedPath, feedStr);

  const now = new Date();
  if (now.getUTCMinutes() === 0) {
    const archivePath = path.join(
      __dirname,
      `../public/archive/${now.getUTCFullYear()}/` +
      `${String(now.getUTCMonth() + 1).padStart(2, '0')}/` +
      `${String(now.getUTCDate()).padStart(2, '0')}/` +
      `${String(now.getUTCHours()).padStart(2, '0')}.json`
    );
    await fs.mkdir(path.dirname(archivePath), { recursive: true });
    await fs.writeFile(archivePath, feedStr);
  }

  console.log(`WROTE ${feedBytes} BYTES`);
}

main().catch(e => { console.error(e); process.exit(1); });
