// lib/news.ts
import Parser from 'rss-parser';
import { OpenAI } from 'openai';
import { sha1 } from './hash';

export type Item = {
  id: string; title: string; url: string; source_id: string; source_name: string;
  published: string | null; image: string | null; summary_90w?: string; key_fact?: string;
  topics?: string[]; entities?: string[]; region?: string; lang?: string; raw?: string;
};

const SOURCES = [
  { id: 'guardian-world', url: 'https://www.theguardian.com/world/rss' },
  { id: 'verge-tech', url: 'https://www.theverge.com/rss/index.xml' },
  { id: 'bbc-business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml' },
  { id: 'reuters-markets', url: 'https://www.reuters.com/markets/rss' },
  { id: 'nyt-markets', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Markets.xml' },
  { id: 'yahoo-markets', url: 'https://finance.yahoo.com/news/rssindex' },
  { id: 'espn-sports', url: 'https://www.espn.com/espn/rss/news' },
  { id: 'guardian-entertainment', url: 'https://www.theguardian.com/uk/culture/rss' }
];

const parser = new Parser();

const DISABLE = process.env.DISABLE_SUMMARIES === '1';
let openai: OpenAI | null = null;
if (!DISABLE && process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function fetchRss(): Promise<Item[]> {
  const items: Item[] = [];
  for (const s of SOURCES) {
    const feed = await parser.parseURL(s.url);
    for (const it of feed.items.slice(0, 5)) {
      const title = (it.title || '').trim();
      const url = it.link!;
      const id = sha1((title + url).toLowerCase()).slice(0, 16);
      // --- Topic assignment ---
      let topics: string[] = [];
      const lowerTitle = title.toLowerCase();
      if (s.id.includes('world') || lowerTitle.includes('world')) topics.push('World');
      if (s.id.includes('business') || lowerTitle.includes('business') || lowerTitle.includes('market')) topics.push('Business');
      if (s.id.includes('tech') || s.id.includes('technology') || lowerTitle.includes('tech') || lowerTitle.includes('ai') || lowerTitle.includes('technology')) topics.push('Technology');
      if (s.id.includes('market') || lowerTitle.includes('market')) topics.push('Markets');
      if (s.id.includes('sport') || lowerTitle.includes('sport')) topics.push('Sports');
      if (s.id.includes('entertain') || lowerTitle.includes('entertain')) topics.push('Entertainment');
      if (topics.length === 0) topics.push('World');
      items.push({
        id, title, url,
        source_id: s.id,
        source_name: feed.title || s.id,
        published: (it as any).isoDate || it.pubDate || null,
        image: (it as any).enclosure?.url || null,
        raw: (it as any).contentSnippet || (it as any).content || '',
        topics
      });
    }
  }
  const seen = new Set();
  return items.filter(i => !seen.has(i.title.toLowerCase()) && seen.add(i.title.toLowerCase()));
}

export async function summarizeBatch(items: Item[]): Promise<Item[]> {
  if (!openai) {
    return items.map(i => ({
      ...i,
      summary_90w: (i.raw || i.title).slice(0, 400),
      key_fact: '',
      topics: i.topics ?? [], // <-- preserve topics from fetchRss
      entities: [],
      region: '',
      lang: 'en'
    }));
  }

  const out: Item[] = [];
  for (const i of items) {
    const prompt = `
You are a professional news editor.
Summarize in 60 words, neutral tone. Include exactly one concise key fact phrase.
Return strict JSON:
{
 "summary_90w": "...",
 "key_fact": "...",
 "topics": [],
 "entities": [],
 "region": "",
 "lang": "en"
}
TITLE: ${i.title}
SOURCE: ${i.source_name}
CONTENT:
${(i.raw || '').slice(0, 5000)}
`.trim();

    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }]
    });

    let json: any = {};
    try { json = JSON.parse(r.choices[0].message.content || '{}'); }
    catch { json = { summary_90w: i.title, key_fact: '', topics: [], entities: [], region: '', lang: 'en' }; }

    out.push({ ...i, ...json });
  }
  return out;
}

export async function buildFeedJson(): Promise<string> {
  const base = await fetchRss();
  const enriched = await summarizeBatch(base);
  const payload = { version: Date.now().toString(), generatedAt: new Date().toISOString(), items: enriched };
  return JSON.stringify(payload, null, 2);
}