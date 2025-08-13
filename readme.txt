All Prompts used:

=== Index ===
- Build & Setup Instructions
- Prerequisites
- Environment Variables
- Installation
- Build
- Run (Local)
- Tests
- Prompts
--- Prompts — Developer-Friendly
--- Prompts — Human-Friendly
--- Prompt Library
--- Prompts as JSON

----------------------------------------
----------------------------------------

=== Build & Setup Instructions ===

Project Name: NewsFlash_repo
Primary Language: TypeScript
Stack: nextjs, node, react

=== Prerequisites ===
Operating Systems: macOS 14+, Ubuntu 22.04+
Required Tools:
  - node >=18
  - npm or pnpm (latest)

=== Environment Variables ===
  - NEXT_PUBLIC_FEED_FALLBACK
  - NEXT_PUBLIC_FEED_URL

=== Installation ===
  - cd NewsFlash/quicknews && npm ci

=== Build ===
  - cd NewsFlash/quicknews && npm run build

=== Run (Local) ===
  - cd NewsFlash/quicknews && npm run dev
  - cd NewsFlash/quicknews && npm start

=== Tests ===
Lint Steps:
  - cd NewsFlash/quicknews && npm run lint


=== Prompts — Developer-Friendly ===

[NewsFlash/quicknews/readme.txt] prompt_1:
[RSS] ${res.status} for ${url} (attempt ${i}/${attempts})

[NewsFlash/quicknews/readme.txt] prompt_2:
[RSS] fetch error (${i}/${attempts}) for ${url}:

[NewsFlash/quicknews/readme.txt] prompt_3:
);
    const xml = await fetchWithRetry(src.url, 3);
    if (!xml) {
      console.warn(

[NewsFlash/quicknews/readme.txt] prompt_4:
);
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
      }));
      console.log(

[NewsFlash/quicknews/readme.txt] prompt_5:
);
      collected.push(...items);
    } catch (e: any) {
      console.warn(

[NewsFlash/quicknews/readme.txt] prompt_6:
, e?.message || e);
    }
  }

  const before = collected.length;
  const deduped = dedupeByTitleAndURL(collected);
  console.log(

[NewsFlash/quicknews/readme.txt] prompt_7:
const FEED_URL =
  process.env.NEXT_PUBLIC_FEED_URL
  ?? (typeof window !== 'undefined' && window.location.pathname.startsWith('/newsflash')
        ? '/newsflash/data/feed.json'
        : '/data/feed.json');

const FEED_FALLBACK =
  process.env.NEXT_PUBLIC_FEED_FALLBACK
  || 'https://raw.githubusercontent.com/oyemello/newsflash/gh-pages/data/feed.json';

[NewsFlash/quicknews/readme.txt] prompt_8:
async function fetchJsonWithFallback(primary: string, fallback: string) {
  const bust = (u:string)=> u + (u.includes('?')?'&':'?') + 'v=' + Date.now();
  try {
    const r = await fetch(bust(primary), { cache:'no-store' });
    if (r.ok) return await r.json();
    console.warn('Primary feed failed', r.status);
  } catch (e:any) {
    console.warn('Primary feed error:', e?.message || e);
  }
  const r2 = await fetch(bust(fallback), { cache:'no-store' });
  if (!r2.ok) throw new Error('Both feed URLs failed: ' + r2.status);
  return await r2.json();
}

export default function Home()


=== Prompts — Human-Friendly ===

[NewsFlash/quicknews/readme.txt] prompt_1:
[RSS] ${res.status} for ${url} (attempt ${i}/${attempts})

[NewsFlash/quicknews/readme.txt] prompt_2:
[RSS] fetch error (${i}/${attempts}) for ${url}:

[NewsFlash/quicknews/readme.txt] prompt_3:
);
 const xml = await fetchWithRetry(src.url, 3);
 if (!xml) {
 console.warn(

[NewsFlash/quicknews/readme.txt] prompt_4:
);
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
 }));
 console.log(

[NewsFlash/quicknews/readme.txt] prompt_5:
);
 collected.push(...items);
 } catch (e: any) {
 console.warn(

[NewsFlash/quicknews/readme.txt] prompt_6:
, e?.message || e);
 }
 }

 const before = collected.length;
 const deduped = dedupeByTitleAndURL(collected);
 console.log(

[NewsFlash/quicknews/readme.txt] prompt_7:
const FEED_URL =
 process.env.NEXT_PUBLIC_FEED_URL
 ?? (typeof window !== 'undefined' && window.location.pathname.startsWith('/newsflash')
 ? '/newsflash/data/feed.json'
 : '/data/feed.json');

const FEED_FALLBACK =
 process.env.NEXT_PUBLIC_FEED_FALLBACK
 || 'https://raw.githubusercontent.com/oyemello/newsflash/gh-pages/data/feed.json';

[NewsFlash/quicknews/readme.txt] prompt_8:
async function fetchJsonWithFallback(primary: string, fallback: string) {
 const bust = (u:string)=> u + (u.includes('?')?'&':'?') + 'v=' + Date.now();
 try {
 const r = await fetch(bust(primary), { cache:'no-store' });
 if (r.ok) return await r.json();
 console.warn('Primary feed failed', r.status);
 } catch (e:any) {
 console.warn('Primary feed error:', e?.message || e);
 }
 const r2 = await fetch(bust(fallback), { cache:'no-store' });
 if (!r2.ok) throw new Error('Both feed URLs failed: ' + r2.status);
 return await r2.json();
}

export default function Home()



=== Prompt Library ===

Name: NewsFlash/quicknews/readme.txt::prompt_1
File: NewsFlash/quicknews/readme.txt
Role: unspecified
Purpose: General Instruction
Variables: RSS
Prompt Text:
[RSS] ${res.status} for ${url} (attempt ${i}/${attempts})
----------------------------------------
Name: NewsFlash/quicknews/readme.txt::prompt_2
File: NewsFlash/quicknews/readme.txt
Role: unspecified
Purpose: Information Retrieval
Variables: RSS
Prompt Text:
[RSS] fetch error (${i}/${attempts}) for ${url}:
----------------------------------------
Name: NewsFlash/quicknews/readme.txt::prompt_3
File: NewsFlash/quicknews/readme.txt
Role: unspecified
Purpose: Information Retrieval
Variables: None
Prompt Text:
);
 const xml = await fetchWithRetry(src.url, 3);
 if (!xml) {
 console.warn(
----------------------------------------
Name: NewsFlash/quicknews/readme.txt::prompt_4
File: NewsFlash/quicknews/readme.txt
Role: unspecified
Purpose: Summarization
Variables: None
Prompt Text:
);
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
 }));
 console.log(
----------------------------------------
Name: NewsFlash/quicknews/readme.txt::prompt_5
File: NewsFlash/quicknews/readme.txt
Role: unspecified
Purpose: General Instruction
Variables: None
Prompt Text:
);
 collected.push(...items);
 } catch (e: any) {
 console.warn(
----------------------------------------
Name: NewsFlash/quicknews/readme.txt::prompt_6
File: NewsFlash/quicknews/readme.txt
Role: unspecified
Purpose: General Instruction
Variables: None
Prompt Text:
, e?.message || e);
 }
 }

 const before = collected.length;
 const deduped = dedupeByTitleAndURL(collected);
 console.log(
----------------------------------------
Name: NewsFlash/quicknews/readme.txt::prompt_7
File: NewsFlash/quicknews/readme.txt
Role: unspecified
Purpose: Information Retrieval
Variables: None
Prompt Text:
const FEED_URL =
 process.env.NEXT_PUBLIC_FEED_URL
 ?? (typeof window !== 'undefined' && window.location.pathname.startsWith('/newsflash')
 ? '/newsflash/data/feed.json'
 : '/data/feed.json');

const FEED_FALLBACK =
 process.env.NEXT_PUBLIC_FEED_FALLBACK
 || 'https://raw.githubusercontent.com/oyemello/newsflash/gh-pages/data/feed.json';
----------------------------------------
Name: NewsFlash/quicknews/readme.txt::prompt_8
File: NewsFlash/quicknews/readme.txt
Role: unspecified
Purpose: Information Retrieval
Variables: None
Prompt Text:
async function fetchJsonWithFallback(primary: string, fallback: string) {
 const bust = (u:string)=> u + (u.includes('?')?'&':'?') + 'v=' + Date.now();
 try {
 const r = await fetch(bust(primary), { cache:'no-store' });
 if (r.ok) return await r.json();
 console.warn('Primary feed failed', r.status);
 } catch (e:any) {
 console.warn('Primary feed error:', e?.message || e);
 }
 const r2 = await fetch(bust(fallback), { cache:'no-store' });
 if (!r2.ok) throw new Error('Both feed URLs failed: ' + r2.status);
 return await r2.json();
}

export default function Home()
----------------------------------------

=== Prompts as JSON ===
{
  "prompts": [
    {
      "name": "NewsFlash/quicknews/readme.txt::prompt_1",
      "file": "NewsFlash/quicknews/readme.txt",
      "role": "unspecified",
      "purpose": "General Instruction",
      "variables": [
        "RSS"
      ],
      "text": "[RSS] ${res.status} for ${url} (attempt ${i}/${attempts})"
    },
    {
      "name": "NewsFlash/quicknews/readme.txt::prompt_2",
      "file": "NewsFlash/quicknews/readme.txt",
      "role": "unspecified",
      "purpose": "Information Retrieval",
      "variables": [
        "RSS"
      ],
      "text": "[RSS] fetch error (${i}/${attempts}) for ${url}:"
    },
    {
      "name": "NewsFlash/quicknews/readme.txt::prompt_3",
      "file": "NewsFlash/quicknews/readme.txt",
      "role": "unspecified",
      "purpose": "Information Retrieval",
      "variables": [],
      "text": ");\n const xml = await fetchWithRetry(src.url, 3);\n if (!xml) {\n console.warn("
    },
    {
      "name": "NewsFlash/quicknews/readme.txt::prompt_4",
      "file": "NewsFlash/quicknews/readme.txt",
      "role": "unspecified",
      "purpose": "Summarization",
      "variables": [],
      "text": ");\n continue;\n }\n try {\n const feed = await parser.parseString(xml);\n const items = (feed.items || []).slice(0, 30).map((x: any) => ({\n id: crypto.createHash(\"sha1\").update(String(x.link || x.id || x.guid || x.title)).digest(\"hex\"),\n title: x.title || \"\",\n url: x.link || \"\",\n source_id: src.id,\n source_name: feed.title || src.id,\n published: x.isoDate || x.pubDate || null,\n summary_90w: null,\n topics: src.topics || [],\n }));\n console.log("
    },
    {
      "name": "NewsFlash/quicknews/readme.txt::prompt_5",
      "file": "NewsFlash/quicknews/readme.txt",
      "role": "unspecified",
      "purpose": "General Instruction",
      "variables": [],
      "text": ");\n collected.push(...items);\n } catch (e: any) {\n console.warn("
    },
    {
      "name": "NewsFlash/quicknews/readme.txt::prompt_6",
      "file": "NewsFlash/quicknews/readme.txt",
      "role": "unspecified",
      "purpose": "General Instruction",
      "variables": [],
      "text": ", e?.message || e);\n }\n }\n\n const before = collected.length;\n const deduped = dedupeByTitleAndURL(collected);\n console.log("
    },
    {
      "name": "NewsFlash/quicknews/readme.txt::prompt_7",
      "file": "NewsFlash/quicknews/readme.txt",
      "role": "unspecified",
      "purpose": "Information Retrieval",
      "variables": [],
      "text": "const FEED_URL =\n process.env.NEXT_PUBLIC_FEED_URL\n ?? (typeof window !== 'undefined' && window.location.pathname.startsWith('/newsflash')\n ? '/newsflash/data/feed.json'\n : '/data/feed.json');\n\nconst FEED_FALLBACK =\n process.env.NEXT_PUBLIC_FEED_FALLBACK\n || 'https://raw.githubusercontent.com/oyemello/newsflash/gh-pages/data/feed.json';"
    },
    {
      "name": "NewsFlash/quicknews/readme.txt::prompt_8",
      "file": "NewsFlash/quicknews/readme.txt",
      "role": "unspecified",
      "purpose": "Information Retrieval",
      "variables": [],
      "text": "async function fetchJsonWithFallback(primary: string, fallback: string) {\n const bust = (u:string)=> u + (u.includes('?')?'&':'?') + 'v=' + Date.now();\n try {\n const r = await fetch(bust(primary), { cache:'no-store' });\n if (r.ok) return await r.json();\n console.warn('Primary feed failed', r.status);\n } catch (e:any) {\n console.warn('Primary feed error:', e?.message || e);\n }\n const r2 = await fetch(bust(fallback), { cache:'no-store' });\n if (!r2.ok) throw new Error('Both feed URLs failed: ' + r2.status);\n return await r2.json();\n}\n\nexport default function Home()\n----------------------------------------"
    }
  ]
}