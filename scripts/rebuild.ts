import fs from "node:fs/promises";
import crypto from "node:crypto";
import Parser from "rss-parser";
import OpenAI from 'openai';

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
  // Guardian + Verge (already working)
  { id: "guardian-world", url: "https://www.theguardian.com/world/rss",               topics: ["World"] },
  { id: "verge-tech",     url: "https://www.theverge.com/rss/index.xml",             topics: ["Technology"] },

  // BBC (official)
  { id: "bbc-top",        url: "https://feeds.bbci.co.uk/news/rss.xml",              topics: ["World"] },
  { id: "bbc-world",      url: "https://feeds.bbci.co.uk/news/world/rss.xml",        topics: ["World"] },
  { id: "bbc-tech",       url: "https://feeds.bbci.co.uk/news/technology/rss.xml",   topics: ["Technology"] },

  // NPR (official)
  { id: "npr-top",        url: "https://feeds.npr.org/1001/rss.xml",                 topics: ["World"] },
  { id: "npr-business",   url: "https://feeds.npr.org/1006/rss.xml",                 topics: ["Business"] },
  { id: "npr-tech",       url: "https://feeds.npr.org/1019/rss.xml",                 topics: ["Technology"] },

  // TechCrunch (official)
  { id: "techcrunch",     url: "https://techcrunch.com/feed/",                       topics: ["Technology"] },
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
        redirect: "follow",
      });
      if (!res.ok) {
        console.warn(`[RSS] ${res.status} for ${url} (attempt ${i}/${attempts})`);
        if (i === attempts) return null;
      } else {
        return await res.text();
      }
    } catch (e: any) {
      console.warn(`[RSS] fetch error (${i}/${attempts}) for ${url}:`, e?.message || e);
      if (i === attempts) return null;
    }
    await new Promise(r => setTimeout(r, backoff));
    backoff *= 2;
  }
  return null;
}

function dedupeByTitleAndURL<T extends { title?: string; url?: string }>(items: T[]) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const i of items) {
    const key = ((i.title || "").toLowerCase().replace(/\s+/g, " ").slice(0, 140)) + "|" + (i.url || "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(i);
  }
  return out;
}

const SUM_DISABLE = process.env.DISABLE_SUMMARIES === '1';
const MAX_SUMMARIES = Number(process.env.MAX_SUMMARIES || 40);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function clip(text: string, n = 3000) {
  return (text || '').slice(0, n);
}

async function summarizeItem(title: string, snippet: string, source: string) {
  const prompt = `Summarize this news item in 60–90 words, neutral tone, 1 concrete fact (date/number/quote if notable). Return plain text.\nSource: ${source}\nTitle: ${title}\nContent:\n${snippet}`;
  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }]
  });
  const out = r.choices?.[0]?.message?.content?.trim() || "";
  return out;
}

export async function buildFeedJson() {
  console.log("=== REBUILD START ===");
  console.log("SUMMARIES:", SUM_DISABLE ? "disabled" : "enabled", "MAX:", MAX_SUMMARIES);
  const collected: any[] = [];

  for (const src of SOURCES) {
    console.log(`-- fetch: ${src.id} -> ${src.url}`);
    const xml = await fetchWithRetry(src.url, 3);
    if (!xml) {
      console.warn(`!! SKIP (fetch failed): ${src.id}`);
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
        raw: x.contentSnippet || x.content || '',
        summary_90w: null,
        topics: src.topics || [],
      }));
      console.log(`   ok: ${src.id} items=${items.length}`);
      // __SUM__
      if (!SUM_DISABLE) {
        let done = 0;
        for (const it of items) {
          if (done >= MAX_SUMMARIES) break;
          try {
            if (!it.summary_90w || String(it.summary_90w).trim() === "") {
              const raw = String(it.title || "") + "\n\n" + String(it.summary_90w || it.raw || "");
              const summary = await summarizeItem(it.title || "", clip(raw, 3000), it.source_name || it.source_id || "unknown");
              it.summary_90w = typeof summary === 'string' ? summary : null;
              done++;
            }
          } catch (e:any) {
            console.warn("summarize error:", e?.message || e);
          }
        }
        console.log(`   summarized: ${done} for ${src.id}`);
      }
      collected.push(...items);
    } catch (e: any) {
      console.warn(`!! PARSE error (${src.id}):`, e?.message || e);
    }
  }

  const before = collected.length;
  const deduped = dedupeByTitleAndURL(collected);
  console.log(`DEDUPE removed ${before - deduped.length} (kept ${deduped.length})`);

  // newest-first sort
  const parseTS = (v: any) => Date.parse(v || 0);
  deduped.sort((a,b) => (parseTS(b.published) - parseTS(a.published)) || (a.title||"").localeCompare(b.title||""));

  const out = {
    version: String(Date.now()),
    generatedAt: new Date().toISOString(),
    items: deduped,
  };

  await fs.mkdir("public/data", { recursive: true });
  await fs.writeFile("public/data/feed.json", JSON.stringify(out, null, 2));
  console.log("WROTE feed -> public/data/feed.json");
  console.log("=== REBUILD DONE ===");
  return out;
}

// if run directly
if (require.main === module) {
  buildFeedJson().catch((e) => {
    console.error("REBUILD FAILED", e);
    process.exit(1);
  });
}
