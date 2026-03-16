"use client";

import { useEffect, useMemo, useState } from "react";
import { Item } from "@/lib/news";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Moon, Sun, Search, SlidersHorizontal, ArrowUpDown, ExternalLink } from "lucide-react";

const TOPIC_TABS = ["All", "World", "Business", "Technology", "Markets", "Sports", "Entertainment"];

const FEED_URL =
  process.env.NEXT_PUBLIC_FEED_URL ??
  (typeof window !== "undefined" && window.location.pathname.startsWith("/newsflash")
    ? "/newsflash/data/feed.json"
    : "/data/feed.json");

const FEED_FALLBACK =
  process.env.NEXT_PUBLIC_FEED_FALLBACK ||
  "https://raw.githubusercontent.com/oyemello/newsflash/gh-pages/data/feed.json";

async function fetchJsonWithFallback(primary: string, fallback: string) {
  const bust = (u: string) => u + (u.includes("?") ? "&" : "?") + "v=" + Date.now();
  try {
    const r = await fetch(bust(primary), { cache: "no-store" });
    if (r.ok) return await r.json();
  } catch {}
  const r2 = await fetch(bust(fallback), { cache: "no-store" });
  if (!r2.ok) throw new Error("Both feed URLs failed: " + r2.status);
  return await r2.json();
}

function topicForItem(item: Item): string {
  if (item.topics && item.topics.length) return item.topics[0] || "World";
  const sid = (item.source_id || "").toLowerCase();
  const t = (item.title || "").toLowerCase();
  if (sid.includes("world")) return "World";
  if (sid.includes("business") || t.includes("market")) return "Business";
  if (sid.includes("tech") || t.includes("ai")) return "Technology";
  if (sid.includes("market")) return "Markets";
  if (sid.includes("sport")) return "Sports";
  if (sid.includes("entertain")) return "Entertainment";
  return "World";
}

function formatDate(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - date.getTime()) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH === 1) return "1h ago";
  if (diffH < 24) return `${diffH}h ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export default function Home() {
  const [news, setNews] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [dark, setDark] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [enabledSources, setEnabledSources] = useState<string[]>([]);

  // Dark mode
  useEffect(() => {
    const saved = localStorage.getItem("newsflash.theme");
    if (saved === "dark") setDark(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("newsflash.theme", dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Fetch feed
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJsonWithFallback(FEED_URL, FEED_FALLBACK);
        const items: Item[] = Array.isArray(data) ? data : (data.items ?? []);
        setNews(items);
        setVersion(data.version ?? null);
        setNewsError(null);
      } catch (err: any) {
        setNewsError(err?.message || "Failed to fetch news");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Poll for updates
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const data = await fetchJsonWithFallback(FEED_URL, FEED_FALLBACK);
        if (data.version && data.version !== version) {
          const items: Item[] = Array.isArray(data) ? data : (data.items ?? []);
          setNews(items);
          setVersion(data.version);
        }
      } catch {}
    }, 60000);
    return () => clearInterval(id);
  }, [version]);

  const allSources = useMemo(() => {
    const set = new Set<string>();
    news.forEach((i) => set.add(i.source_name || i.source_id));
    return Array.from(set).sort();
  }, [news]);

  // Default: all sources enabled
  useEffect(() => {
    if (allSources.length && enabledSources.length === 0) {
      setEnabledSources(allSources);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSources]);

  const filtered = useMemo(() => {
    let list = news;
    if (enabledSources.length && enabledSources.length < allSources.length) {
      list = list.filter((i) => enabledSources.includes(i.source_name || i.source_id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.summary_90w ?? "").toLowerCase().includes(q) ||
          (i.source_name ?? i.source_id ?? "").toLowerCase().includes(q)
      );
    }
    if (activeTopic !== "All") {
      list = list.filter((i) => topicForItem(i).toLowerCase() === activeTopic.toLowerCase());
    }
    return [...list].sort((a, b) => {
      const da = new Date(a.published ?? 0).getTime();
      const db = new Date(b.published ?? 0).getTime();
      return sortOrder === "latest" ? db - da : da - db;
    });
  }, [news, searchQuery, activeTopic, sortOrder, enabledSources, allSources]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground">Loading feed…</p>
        </div>
      </div>
    );
  }

  if (newsError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Could not load feed</h2>
          <p className="text-sm text-muted-foreground">{newsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-14 items-center gap-4">
          <span className="font-bold text-lg tracking-tight shrink-0">NewsFlash</span>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search headlines…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Sort */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder((s) => (s === "latest" ? "oldest" : "latest"))}
              className="gap-1.5"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortOrder === "latest" ? "Latest" : "Oldest"}
            </Button>

            {/* Sources filter */}
            <Dialog open={sourcesOpen} onOpenChange={setSourcesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Sources
                  {enabledSources.length < allSources.length && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                      {enabledSources.length}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Filter Sources</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledSources.length === allSources.length}
                      onChange={(e) => setEnabledSources(e.target.checked ? allSources : [])}
                      className="rounded"
                    />
                    <span className="font-medium">All sources</span>
                  </label>
                  <div className="border-t pt-2 space-y-2">
                    {allSources.map((src) => (
                      <label key={src} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabledSources.includes(src)}
                          onChange={(e) =>
                            setEnabledSources((prev) =>
                              e.target.checked ? [...prev, src] : prev.filter((s) => s !== src)
                            )
                          }
                          className="rounded"
                        />
                        {src}
                      </label>
                    ))}
                  </div>
                </div>
                <Button size="sm" onClick={() => setSourcesOpen(false)}>
                  Done
                </Button>
              </DialogContent>
            </Dialog>

            {/* Theme */}
            <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Topic tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {TOPIC_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTopic(tab)}
                className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTopic === tab
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Count */}
        <p className="text-xs text-muted-foreground mb-4">
          {filtered.length} {filtered.length === 1 ? "story" : "stories"}
          {activeTopic !== "All" && ` in ${activeTopic}`}
          {searchQuery && ` matching \u201c${searchQuery}\u201d`}
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-muted-foreground">No stories found.</p>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <NewsCard key={item.id ?? item.url} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function NewsCard({ item }: { item: Item }) {
  const topic = topicForItem(item);
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <Badge variant="secondary" className="text-xs shrink-0">
            {topic}
          </Badge>
          <span className="text-xs text-muted-foreground shrink-0">{formatDate(item.published)}</span>
        </div>
        <CardTitle className="leading-snug">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline underline-offset-2"
          >
            {item.title}
          </a>
        </CardTitle>
      </CardHeader>

      {item.summary_90w && (
        <CardContent className="flex-1 pb-2">
          <p className="text-sm text-muted-foreground line-clamp-3">{item.summary_90w}</p>
        </CardContent>
      )}

      <CardFooter className="pt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          {item.source_name ?? item.source_id}
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Read <ExternalLink className="h-3 w-3" />
        </a>
      </CardFooter>
    </Card>
  );
}
