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
  { id: 'verge-tech', url: 'https://www.theverge.com/rss/index.xml' }
];

const parser = new Parser();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function fetchRss(): Promise<Item[]> {
  const items: Item[] = [];
  for (const s of SOURCES) {
    const feed = await parser.parseURL(s.url);
    for (const it of feed.items.slice(0, 30)) {
      const title = (it.title || '').trim();
      const url = it.link!;
      const id = sha1((title + url).toLowerCase()).slice(0, 16);
      items.push({
        id, title, url,
        source_id: s.id,
        source_name: feed.title || s.id,
        published: (it as any).isoDate || it.pubDate || null,
        image: (it as any).enclosure?.url || null,
        raw: (it as any).contentSnippet || (it as any).content || ''
      });
    }
  }
  const seen = new Set();
  return items.filter(i => !seen.has(i.title.toLowerCase()) && seen.add(i.title.toLowerCase()));
}

export async function summarizeBatch(items: Item[]): Promise<Item[]> {
  const out: Item[] = [];
  for (const i of items) {
    if (!openai) {
      // Fallback when OpenAI is not available
      out.push({ 
        ...i, 
        summary_90w: i.title,
        key_fact: '',
        topics: [],
        entities: [],
        region: '',
        lang: 'en'
      });
      continue;
    }

    const prompt = `
You are a professional news editor.
Summarize in 60–90 words, neutral tone. Include exactly one concise key fact phrase.
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
    try {
      json = JSON.parse(r.choices[0].message.content || '{}');
    } catch {
      json = { summary_90w: i.title, key_fact: '', topics: [], entities: [], region: '', lang: 'en' };
    }
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