"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useMemo, useState } from "react";
import { Item } from "@/lib/news";

const TOPIC_TABS = ["All","World","Business","Technology","Markets","Sports","Entertainment"];

function topicForItem(item: Item): string {
  if (item.topics && item.topics.length) return (item.topics[0] || 'World');
  const sid = (item.source_id || '').toLowerCase();
  const t = (item.title || '').toLowerCase();
  if (sid.includes('world')) return 'World';
  if (sid.includes('business') || t.includes('market')) return 'Business';
  if (sid.includes('tech') || sid.includes('technology') || t.includes('ai')) return 'Technology';
  if (sid.includes('market')) return 'Markets';
  if (sid.includes('sport')) return 'Sports';
  if (sid.includes('entertain')) return 'Entertainment';
  return 'World';
}

// --- Preferences Hook ---
function usePrefs(allSources: string[], allTopics: string[]) {
  const [sources, setSources] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  // Load from localStorage or URL
  useEffect(() => {
    // Try URL params first
    const params = new URLSearchParams(window.location.search);
    const urlSources = params.get("sources");
    const urlTopics = params.get("topics");
    if (urlSources) setSources(urlSources.split(",").filter(Boolean));
    else {
      const lsSources = localStorage.getItem("newsflash.sources");
      if (lsSources) setSources(JSON.parse(lsSources));
    }
    if (urlTopics) setTopics(urlTopics.split(",").filter(Boolean));
    else {
      const lsTopics = localStorage.getItem("newsflash.topics");
      if (lsTopics) setTopics(JSON.parse(lsTopics));
    }
  }, [allSources.length, allTopics.length]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("newsflash.sources", JSON.stringify(sources));
  }, [sources]);
  useEffect(() => {
    localStorage.setItem("newsflash.topics", JSON.stringify(topics));
  }, [topics]);

  function applyFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const urlSources = params.get("sources");
    const urlTopics = params.get("topics");
    if (urlSources) setSources(urlSources.split(",").filter(Boolean));
    if (urlTopics) setTopics(urlTopics.split(",").filter(Boolean));
  }

  function toQueryString() {
    const params = new URLSearchParams();
    if (sources.length) params.set("sources", sources.join(","));
    if (topics.length) params.set("topics", topics.join(","));
    return params.toString();
  }

  return { sources, topics, setSources, setTopics, applyFromUrl, toQueryString };
}

function useLastUpdated(pollMs = 60000) {
  // Use FEED_URL from above
  const [iso, setIso] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [lastUpdatedError, setLastUpdatedError] = useState<string | null>(null);

  async function fetchOnce(signal?: AbortSignal) {
    try {
      const res = await fetch(FEED_URL, { cache: "no-store", signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json?.generatedAt) setIso(json.generatedAt);
      if (json?.version) setVersion(String(json.version));
      setLastUpdatedError(null);
    } catch (e: any) {
      setLastUpdatedError(e?.message || "fetch failed");
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    fetchOnce(ctrl.signal);
    const id = setInterval(() => fetchOnce(), pollMs);
    return () => {
      ctrl.abort();
      clearInterval(id);
    };
  }, [pollMs]);

  const label = useMemo(() => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }, [iso]);

  return { label, lastUpdatedError, version };
}

const FEED_URL =
  process.env.NEXT_PUBLIC_FEED_URL
  ?? (typeof window !== 'undefined' && window.location.pathname.startsWith('/newsflash')
        ? '/newsflash/data/feed.json'
        : '/data/feed.json');

const FEED_FALLBACK =
  process.env.NEXT_PUBLIC_FEED_FALLBACK
  || 'https://raw.githubusercontent.com/oyemello/newsflash/gh-pages/data/feed.json';

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

export default function Home() {
  // 1A: Last updated polling
  const { label, lastUpdatedError, version } = useLastUpdated(60000);
  // 1B: State declarations
  const [news, setNews] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredNews, setFilteredNews] = useState<Item[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>(TOPIC_TABS[0]);
  const [prefsOpen, setPrefsOpen] = useState(false);
  // --- Theme state ---
  const [theme, setTheme] = useState<'light'|'dark'>(
    typeof window !== 'undefined'
      ? (localStorage.getItem('newsflash.theme') as 'light'|'dark' ?? 'light')
      : 'light'
  );
  useEffect(() => {
    localStorage.setItem('newsflash.theme', theme);
    document.body.classList.toggle('bg-dark', theme === 'dark');
    document.body.classList.toggle('bg-light', theme === 'light');
    document.body.classList.toggle('text-light', theme === 'dark');
    document.body.classList.toggle('text-dark', theme === 'light');
  }, [theme]);
  function handleThemeSwitch() {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }

  // --- Debug overlay ---
  const counts = { news: news?.length ?? 0, filtered: filteredNews?.length ?? 0 };

  // --- Preferences ---
  const allSources = useMemo(() => {
    const set = new Set<string>();
    news.forEach(item => {
      if (item.source_name) set.add(item.source_name);
      else if (item.source_id) set.add(item.source_id);
    });
    return Array.from(set).sort();
  }, [news]);
  const allTopics = useMemo(() => {
    const set = new Set<string>();
    news.forEach(item => {
      if (item.topics && item.topics.length) {
        item.topics.forEach(t => set.add(t));
      }
    });
    if (set.size === 0) {
      ["world","business","technology","markets","sports","entertainment"].forEach(t => set.add(t));
    }
    return Array.from(set).sort();
  }, [news]);
  const prefs = usePrefs(allSources, allTopics);
  const { sources, topics, setSources, setTopics } = prefs;

  // Add state for source preferences
  const [sourcePrefs, setSourcePrefs] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sourcePrefs');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  // Modal state for sources
  const [showSourceModal, setShowSourceModal] = useState(false);

  // Save source preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sourcePrefs', JSON.stringify(sourcePrefs));
    }
  }, [sourcePrefs]);

  // --- Filter state ---
  const [sortOrder, setSortOrder] = useState<'latest'|'oldest'>('latest');

  // --- Filtering effect ---
  useEffect(() => {
    let filtered = news;
    if (sources.length) {
      filtered = filtered.filter(item =>
        sources.includes(item.source_name || item.source_id)
      );
    }
    if (topics.length) {
      filtered = filtered.filter(item =>
        (item.topics && item.topics.some(t => topics.includes(t)))
      );
    }
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.summary_90w ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.source_name ?? item.source_id ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Sort by date
    filtered = filtered.slice().sort((a, b) => {
      const da = new Date(a.published ?? 0).getTime();
      const db = new Date(b.published ?? 0).getTime();
      return sortOrder === 'latest' ? db - da : da - db;
    });
    setFilteredNews(filtered);
  }, [news, sources, topics, searchQuery, sortOrder]);
  // 1H: Memo for listForTab
  const listForTab = useMemo(() => {
    if (activeTopic === "All") return filteredNews;
    return filteredNews.filter(i => topicForItem(i).toLowerCase() === activeTopic.toLowerCase());
  }, [filteredNews, activeTopic]);
  // 1I: Initial fetch and polling
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await fetchJsonWithFallback(FEED_URL, FEED_FALLBACK);
        const items = Array.isArray(data) ? data : (data.items ?? []);
        console.log('feed items len =', items.length);
        setNews(items);
        setFilteredNews(items);
        setNewsError(null);
      } catch (err: any) {
        setNews([]);
        setFilteredNews([]);
        setNewsError(err?.message || "Failed to fetch news");
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
    const interval = setInterval(async () => {
      try {
        const data = await fetchJsonWithFallback(FEED_URL, FEED_FALLBACK);
        const items = Array.isArray(data) ? data : (data.items ?? []);
        if (data.version && data.version !== version) {
          setNews(items);
          setFilteredNews(items);
          setNewsError(null);
        }
      } catch {}
    }, 60000);
    return () => clearInterval(interval);
  }, [version]);

  // Add state for new feed detection
  const [hasNewFeed, setHasNewFeed] = useState(false);

  // Polling logic (assume feedVersion is tracked)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/data/feed.json');
        const data = await res.json();
        if (data.version && data.version !== version) {
          setHasNewFeed(true);
        }
      } catch {}
    }, 60000);
    return () => clearInterval(interval);
  }, [version]);

  function handleTabClick(tab: string) {
    setActiveTopic(tab);
  }

  // --- Render ---
  if (loading) {
    return (
      <main className="flex items-center justify-center h-screen">
        <div className="text-gray-600 text-base">Loading latest feed…</div>
      </main>
    );
  }
  if (newsError) {
    return (
      <main className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error loading news</h1>
          <p className="text-gray-700">{newsError}</p>
        </div>
      </main>
    );
  }

  const hasNews = (news?.length ?? 0) > 0;
  // --- UI ---
  return (
    <main className={`container py-5 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <div className={`position-fixed top-0 end-0 m-3 p-2 rounded shadow ${theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}`} style={{zIndex:50, fontSize:12}}>
        <div>items: {counts.news}</div>
        <div>shown: {counts.filtered}</div>
      </div>
      {/* --- Header --- */}
      <header className="d-flex flex-column align-items-center justify-content-center mb-3" style={{borderBottom: '1px solid #eee'}}>
        <div className="d-flex align-items-center gap-2" style={{background: theme === 'dark' ? 'transparent' : 'rgba(255,255,255,.9)', width: '100%', justifyContent: 'center', padding: '12px 0'}}>
          <span className="fw-semibold">Sort by:</span>
          <button className={`btn btn-sm ${sortOrder === 'latest' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSortOrder('latest')}>Latest</button>
          <button className={`btn btn-sm ${sortOrder === 'oldest' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSortOrder('oldest')}>Oldest</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowSourceModal(true)}>
            Sources{sourcePrefs.length > 0 ? ` (${sourcePrefs.length})` : ''}
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={handleThemeSwitch}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      {/* Genre/topic tabs centered */}
      <div className="d-flex justify-content-center mb-3">
        {/* --- Topic Tabs --- */}
        <ul className="nav nav-tabs mb-4">
          {TOPIC_TABS.map(tab => (
            <li className="nav-item" key={tab}>
              <button
                className={`nav-link${activeTopic === tab ? ' active' : ''}`}
                aria-current={activeTopic === tab ? "page" : undefined}
                style={activeTopic === tab ? { pointerEvents: 'none' } : {}}
                onClick={() => activeTopic !== tab && handleTabClick(tab)}
                disabled={activeTopic === tab}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* --- News List --- */}
      {hasNews && listForTab.length === 0 && (
        <div className="alert alert-warning small mb-2" role="alert">
          No items in this topic yet.
        </div>
      )}
      <div className="row g-4">
        {hasNews && listForTab.length === 0 && (
          <div className="col-12 text-center py-5">
            <h2 className="h4 fw-bold mb-2">No news found</h2>
            <p className="text-muted">Try adjusting your preferences or check back later.</p>
          </div>
        )}
        {!hasNews && (
          <div className="col-12 text-center py-5">
            <span className="text-muted">Loading latest feed…</span>
          </div>
        )}
        {listForTab.length > 0 && listForTab.map((item, index) => (
          <div key={item.id ?? item.url} className="col-md-6 col-lg-4">
            <div className={`card h-100 shadow-sm ${theme === 'dark' ? 'bg-secondary text-light' : ''}`}> 
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary small">{formatDate(item.published)}</span>
                  <span className="text-secondary small">{item.source_name ?? item.source_id ?? ''}</span>
                </div>
                <h5 className="card-title mb-2">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className={`stretched-link text-decoration-none ${theme === 'dark' ? 'text-light' : 'text-dark'}` }>
                    {item.title}
                  </a>
                </h5>
                <p className="card-text text-muted small flex-grow-1">
                  {item.summary_90w ?? ''}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Source Preferences Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 bg-opacity-30 z-50" onClick={() => setShowSourceModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className={`modal-content p-3 ${theme === 'dark' ? 'bg-modal-dark' : 'bg-modal-light'} modal-lg" style={{minWidth: '340px', maxWidth: '480px'}}`}>
              <div className="mb-3">
                {allSources.map(src => (
                  <label key={src} className="d-block mb-2">
                    <input
                      type="checkbox"
                      checked={sourcePrefs.includes(src)}
                      onChange={e => {
                        setSourcePrefs(prefs =>
                          e.target.checked
                            ? [...prefs, src]
                            : prefs.filter(s => s !== src)
                        );
                      }}
                    />{' '}
                    {src}
                  </label>
                ))}
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowSourceModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* New feed alert */}
      {hasNewFeed && (
        <div className="alert alert-info text-center" style={{position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100}}>
          New news available! <button className="btn btn-sm btn-primary ms-2" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      )}
    </main>
  );
}

function formatDate(dateString: string | null) {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) return "Just now";
  if (diffInHours === 1) return "1 hour ago";
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}