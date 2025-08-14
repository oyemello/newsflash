# NewsFlash

A modern AI-powered news aggregator that fetches and summarizes the latest news from RSS feeds using OpenAI.

## Features

- 📰 Real-time news feed from RSS sources (Guardian, Verge)
- 🤖 AI-powered content summarization with OpenAI
- 🔍 Search functionality across news items
- 🎨 Modern, responsive UI with dark mode support
- ⚡ Fast API endpoints with caching
- 🔄 Automatic feed refresh with cron jobs
- 📱 Mobile-friendly design
- 💾 GitHub file storage integration

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4 for content summarization
- **RSS**: RSS Parser for feed aggregation
- **Storage**: GitHub API for file storage

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API Key
- GitHub Personal Access Token (optional, for file storage)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/oyemello/newsflash.git
   cd newsflash
   npm install
   ```

2. **Create environment file:**
   ```bash
   # Create .env.local file with:
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional GitHub configuration for file storage:
   GH_OWNER=your_github_username
   GH_REPO=your_repository_name
   GH_BRANCH=main
   GH_PAT=your_github_personal_access_token
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

### GET `/api/feed`
Fetches the news feed from stored JSON file.

**Response:**
```json
{
  "version": "1234567890",
  "generatedAt": "2023-12-01T10:00:00Z",
  "items": [
    {
      "id": "abc123def456",
      "title": "Breaking News Title",
      "url": "https://example.com/article",
      "source_id": "guardian-world",
      "source_name": "The Guardian",
      "published": "2023-12-01T10:00:00Z",
      "summary_90w": "AI-generated summary of the article...",
      "key_fact": "Key fact about the story",
      "topics": ["technology", "ai"],
      "entities": ["OpenAI", "Microsoft"],
      "region": "US",
      "lang": "en"
    }
  ]
}
```

### GET `/api/rebuild`
Manually rebuilds the news feed by fetching fresh RSS data and processing with AI.

**Response:**
```json
{
  "ok": true,
  "updated": true
}
```

### HEAD `/api/feed.head`
Returns feed metadata in response headers.

**Headers:**
- `ETag`: Content hash for caching
- `Cache-Control`: Caching directives

## RSS Sources

Currently configured sources:
- **The Guardian World**: `https://www.theguardian.com/world/rss`
- **The Verge Tech**: `https://www.theverge.com/rss/index.xml`

To add more sources, edit `lib/news.ts` and add to the `SOURCES` array.

## AI Features

The application uses OpenAI's GPT-4 to:
- Summarize articles in 60-90 words
- Extract key facts
- Identify topics and entities
- Determine article region and language

## Deployment

### Environment Variables

- `OPENAI_API_KEY`: OpenAI API key (required for AI features)
- `GH_OWNER`: GitHub username/organization (optional)
- `GH_REPO`: GitHub repository name (optional)
- `GH_BRANCH`: GitHub branch (default: main)
- `GH_PAT`: GitHub Personal Access Token (optional)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
quicknews/
├── app/
│   ├── api/           # API routes
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main page
├── lib/               # Utility libraries
│   ├── github-files.ts # GitHub file operations
│   ├── github.ts      # GitHub API integration
│   ├── hash.ts        # Hash utilities
│   └── news.ts        # RSS and AI processing
├── public/            # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
