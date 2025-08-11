import fs from "node:fs/promises";
import crypto from "node:crypto";
import Parser from "rss-parser";

type FeedItem = {
  id: string;
  title: string;
  url: string;
  source_id: string;
  source_name: string;
  published: string | null;
  summary_90w?: string | null;
  topics?: string[];
};

const SOURCES = [
  { id: "guardian-world", url: "https://www.theguardian.com/world/rss", topics: ["World"] },
  { id: "verge-tech", url: "https://www.theverge.com/rss/index.xml", topics: ["Technology"] },
  // add others here…
];

const parser = new Parser();
const UA =
  process.env.RSS_USER_AGENT ||
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) NewsFlashBot/1.0 Safari/537.36";

async function fetchWithRetry(url: string, attempts = 3): Promise<string | null> {
  let backoff = 500;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
          "Accept-Language": "en",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Connection": "keep-alive",
        },
      });
      if (!res.ok) {
        console.warn(`RSS ${res.status} for ${url} (attempt ${i}/${attempts})`);
        if (i === attempts) return null;
      } else {
        return await res.text();
      }
    } catch (e: any) {
      console.warn(`RSS fetch error (${i}/${attempts}) for ${url}:`, e?.message || e);
      if (i === attempts) return null;
    }
    await new Promise(r => setTimeout(r, backoff));
    backoff *= 2;
  }
  return null;
}

function dedupeByTitleAndURL(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  const out: FeedItem[] = [];
  for (const i of items) {
    const key =
      (i.title || "").toLowerCase().replace(/\s+/g, " ").slice(0, 140) +
      "|" + (i.url || "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(i);
  }
  return out;
}

export async function buildFeedJson() {
  const collected: FeedItem[] = [];

  for (const src of SOURCES) {
    const xml = await fetchWithRetry(src.url, 3);
    if (!xml) {
      console.warn(`SKIP source due to fetch failure: ${src.id}`);
      continue;
    }
    try {
      const feed = await parser.parseString(xml);
      const items = (feed.items || []).slice(0, 30).map((x: any) => ({
        id: crypto.createHash("sha1").update(String(x.link || x.id || x.guid || x.title)).digest("hex"),
        title: x.title || "",
        url: x.link || "",
        source_id: src.id,
        source_name: feed.title || src.id,
        published: x.isoDate || x.pubDate || null,
        summary_90w: null,
        topics: src.topics || [],
      })) as FeedItem[];
      collected.push(...items);
    } catch (e: any) {
      console.warn(`PARSE error for ${src.id}:`, e?.message || e);
    }
  }

  const before = collected.length;
  const deduped = dedupeByTitleAndURL(collected);
  console.log(`DEDUPE removed ${before - deduped.length} (kept ${deduped.length})`);

  const out = {
    version: String(Date.now()),
    generatedAt: new Date().toISOString(),
    items: deduped,
  };

  await fs.mkdir("public/data", { recursive: true });
  await fs.writeFile("public/data/feed.json", JSON.stringify(out, null, 2));
  console.log("WROTE feed -> public/data/feed.json");
  return out;
}

if (require.main === module) {
  buildFeedJson().catch((e) => {
    console.error("REBUILD FAILED", e);
    process.exit(1);
  });
}
