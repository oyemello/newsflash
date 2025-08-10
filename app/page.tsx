'use client';

import { useState, useEffect } from 'react';
import { Item } from '@/lib/news';

export default function Home() {
  const [news, setNews] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNews, setFilteredNews] = useState<Item[]>([]);
  const [version, setVersion] = useState<string>('');

  const FEED_URL = 'https://oyemello.github.io/newsflash/public/data/feed.json';

  // Fetch feed from GitHub Pages
  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch(FEED_URL);
      if (!response.ok) throw new Error('Feed not found');
      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        setNews(data.items);
        setFilteredNews(data.items);
        setVersion(data.version || '');
        setError(null);
      } else {
        setNews([]);
        setFilteredNews([]);
        setVersion('');
        setError(null);
      }
    } catch (err) {
      setNews([]);
      setFilteredNews([]);
      setVersion('');
      setError(null);
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
          setVersion(data.version);
        }
      } catch {}
    }, 60000);
    return () => clearInterval(interval);
  }, [version]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNews(news);
    } else {
      const filtered = news.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.summary_90w || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNews(filtered);
    }
  }, [searchQuery, news]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading && news.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
                NewsFlash
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Loading the latest developer news...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            NewsFlash
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Stay updated with the latest developer news and releases
          </p>
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </header>
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        {/* News Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md card-hover p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="badge badge-news">
                  {item.source_id}
                </span>
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
                    {item.topics?.slice(0, 3).map(topic => (
                      <span key={topic} className="text-blue-600 dark:text-blue-400">#{topic}</span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
        {/* Empty State */}
        {filteredNews.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {searchQuery ? 'No news found matching your search.' : 'No news available at the moment.'}
            </p>
          </div>
        )}
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