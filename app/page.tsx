"use client";

import { useEffect, useMemo, useState } from "react";
import { Item } from "@/lib/news";

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
  const FEED_URL = "https://oyemello.github.io/newsflash/public/data/feed.json";
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

const TOPIC_TABS = [
  "World", "Business", "Technology", "Markets", "Sports", "Entertainment"
];

export default function Home() {
  const { label, lastUpdatedError, version } = useLastUpdated(60000);
  const [news, setNews] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredNews, setFilteredNews] = useState<Item[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>(TOPIC_TABS[0]);
  const [foldState, setFoldState] = useState<"none"|"fold-out"|"fold-in">("none");
  const [pendingTopic, setPendingTopic] = useState<string|null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const FEED_URL = "https://oyemello.github.io/newsflash/public/data/feed.json";

  // --- Build allSources/allTopics ---
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
    // Fallback buckets if none found
    if (set.size === 0) {
      ["world","business","technology","markets","sports","entertainment"].forEach(t => set.add(t));
    }
    return Array.from(set).sort();
  }, [news]);

  // --- Preferences Hook ---
  const prefs = usePrefs(allSources, allTopics);

  // --- Filtering ---
  useEffect(() => {
    let filtered = news;
    if (prefs.sources.length) {
      filtered = filtered.filter(item =>
        prefs.sources.includes(item.source_name || item.source_id)
      );
    }
    if (prefs.topics.length) {
      filtered = filtered.filter(item =>
        (item.topics && item.topics.some(t => prefs.topics.includes(t)))
      );
    }
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.summary_90w || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.source_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredNews(filtered);
  }, [news, prefs.sources, prefs.topics, searchQuery]);

  // Filtered by topic tab
  const tabFilteredNews = useMemo(() => {
    return filteredNews.filter(item => {
      const topics = (item.topics && item.topics.length) ? item.topics : [item.source_id?.toLowerCase()];
      return topics.some(t => t && t.toLowerCase() === activeTopic.toLowerCase());
    });
  }, [filteredNews, activeTopic]);

  // Animation logic
  function handleTabClick(tab: string) {
    if (tab === activeTopic || foldState !== "none") return;
    setPendingTopic(tab);
    setFoldState("fold-out");
    setTimeout(() => {
      setActiveTopic(tab);
      setFoldState("fold-in");
      setTimeout(() => setFoldState("none"), 230); // match CSS duration
    }, 230); // fold-out duration
  }

  // Check if active tab is in selected topics
  const topicInPrefs = prefs.topics.length === 0 || prefs.topics.some(t => t.toLowerCase() === activeTopic.toLowerCase());

  // Fetch feed from GitHub Pages
  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch(FEED_URL);
      if (!response.ok) throw new Error("Feed not found");
      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        setNews(data.items);
        setFilteredNews(data.items);
        setNewsError(null);
      } else {
        setNews([]);
        setFilteredNews([]);
        setNewsError(null);
      }
    } catch (err: any) {
      setNews([]);
      setFilteredNews([]);
      setNewsError(err?.message || "Failed to fetch news");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchNews();
    const interval = setInterval(async () => {
      try {
        const response = await fetch(FEED_URL);
        if (!response.ok) return;
        const data = await response.json();
        if (data.version && data.version !== version) {
          setNews(data.items || []);
          setFilteredNews(data.items || []);
        }
      } catch {}
    }, 60000);
    return () => clearInterval(interval);
  }, [version]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading && news.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">NewsFlash</h1>
              <p className="text-gray-600 dark:text-gray-300">Loading the latest developer news...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Preferences Modal ---
  function handleSavePrefs() {
    // Persist and update URL
    localStorage.setItem("newsflash.sources", JSON.stringify(prefs.sources));
    localStorage.setItem("newsflash.topics", JSON.stringify(prefs.topics));
    const qs = prefs.toQueryString();
    window.history.replaceState({}, "", qs ? `?${qs}` : window.location.pathname);
    setPrefsOpen(false);
  }

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Sticky Topic Tabs */}
        <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur flex gap-2 mb-4 py-2 px-2 rounded shadow-sm">
          {TOPIC_TABS.map(tab => (
            <button
              key={tab}
              className={`px-3 py-1 rounded font-medium text-sm transition-colors duration-150 ${tab === activeTopic ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-blue-100"}`}
              onClick={() => handleTabClick(tab)}
              aria-current={tab === activeTopic ? "page" : undefined}
            >
              {tab}
            </button>
          ))}
        </nav>
        {/* Header */}
        <header className="flex items-center gap-3 mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">NewsFlash</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-xs text-gray-500">
              Last updated: <span suppressHydrationWarning>{label}</span>
              {lastUpdatedError ? <span className="text-red-500 ml-2">(offline)</span> : null}
            </div>
            <button
              className="ml-4 px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 border border-gray-300"
              onClick={() => setPrefsOpen(true)}
            >
              Preferences
            </button>
          </div>
        </header>
        {/* Preferences Modal/Panel */}
        {prefsOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4">Preferences</h2>
              <div className="mb-4">
                <div className="font-medium mb-1">Sources</div>
                <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                  {allSources.map(src => (
                    <label key={src} className="block text-sm mb-1">
                      <input
                        type="checkbox"
                        checked={prefs.sources.includes(src)}
                        onChange={e => {
                          if (e.target.checked) prefs.setSources([...prefs.sources, src]);
                          else prefs.setSources(prefs.sources.filter(s => s !== src));
                        }}
                        className="mr-2"
                      />
                      {src}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <div className="font-medium mb-1">Topics</div>
                <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                  {allTopics.map(topic => (
                    <label key={topic} className="block text-sm mb-1">
                      <input
                        type="checkbox"
                        checked={prefs.topics.includes(topic)}
                        onChange={e => {
                          if (e.target.checked) prefs.setTopics([...prefs.topics, topic]);
                          else prefs.setTopics(prefs.topics.filter(t => t !== topic));
                        }}
                        className="mr-2"
                      />
                      {topic}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 border border-gray-300"
                  onClick={() => setPrefsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleSavePrefs}
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Hint if tab not in selected topics */}
        {!topicInPrefs && (
          <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mb-2 inline-block">
            Not in selected topics — <button className="underline" onClick={() => setPrefsOpen(true)}>adjust Preferences</button>
          </div>
        )}
        {/* Cards with fold animation */}
        <div className={`fold-stage ${foldState === "fold-out" ? "fold-out" : foldState === "fold-in" ? "fold-in" : ""}`}> 
          <div className="fold-content">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tabFilteredNews.map((item) => (
                <article
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md card-hover p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="badge badge-news">{item.source_id}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(item.published)}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {item.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {item.summary_90w || item.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.source_name}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-sm"
                    >
                      Read More →
                    </a>
                  </div>
                  {/* Metadata */}
                  {(item.key_fact || item.topics?.length) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        {item.key_fact && <span className="badge badge-release">{item.key_fact}</span>}
                        {item.topics?.slice(0, 3).map((topic) => (
                          <span key={topic} className="text-blue-600 dark:text-blue-400">
                            #{topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
            {/* Empty State */}
            {tabFilteredNews.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {searchQuery ? "No news found matching your search." : "No news available at the moment."}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            Powered by RSS Feeds • Built with Next.js
          </p>
        </footer>
      </div>
    </div>
  );
}