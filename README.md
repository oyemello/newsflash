# NewsFlash

A modern news aggregator that fetches the latest releases and updates from popular developer repositories on GitHub.

## Features

- 📰 Real-time news feed from GitHub repositories
- 🔍 Search functionality across news items
- 🎨 Modern, responsive UI with dark mode support
- ⚡ Fast API endpoints with caching
- 🔄 Manual feed refresh capability
- 📱 Mobile-friendly design

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **API**: GitHub REST API via Octokit
- **Deployment**: Vercel-ready

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- GitHub Personal Access Token

### Setup

1. **Clone and install dependencies:**
   ```bash
   cd quicknews
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```

3. **Add your GitHub token:**
   Get a GitHub Personal Access Token from [GitHub Settings](https://github.com/settings/tokens) and add it to `.env.local`:
   ```
   GITHUB_TOKEN=your_github_token_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

### GET `/api/feed`
Fetches the news feed with optional pagination.

**Query Parameters:**
- `limit` (optional): Number of items to return (default: 50)
- `offset` (optional): Number of items to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "github-123",
      "title": "Release v1.0.0",
      "description": "Major release with new features",
      "url": "https://github.com/owner/repo/releases/tag/v1.0.0",
      "published_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z",
      "source": "owner/repo",
      "type": "release",
      "metadata": {
        "repository": "owner/repo",
        "author": "username",
        "language": "TypeScript",
        "stars": 1000,
        "topics": ["javascript", "typescript"]
      }
    }
  ]
}
```

### POST `/api/rebuild`
Manually rebuilds the news feed by fetching fresh data from GitHub.

**Response:**
```json
{
  "success": true,
  "message": "Feed rebuilt successfully",
  "data": [...]
}
```

### HEAD `/api/feed.head`
Returns feed metadata in response headers.

**Headers:**
- `X-Feed-Count`: Total number of items
- `X-Feed-Last-Updated`: Last update timestamp
- `X-Feed-Version`: Feed version

## Configuration

### News Sources
Edit `lib/news.ts` to modify the list of GitHub repositories to monitor:

```typescript
const NEWS_SOURCES = [
  { owner: 'vercel', repo: 'next.js', type: 'release' as const },
  { owner: 'facebook', repo: 'react', type: 'release' as const },
  // Add more repositories here
];
```

### Caching
The app uses in-memory caching with a 1-hour refresh interval. For production, consider using Redis or a similar persistent cache.

## Deployment

### Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Connect your GitHub repository to Vercel
   - Add `GITHUB_TOKEN` environment variable
   - Deploy!

### Environment Variables

- `GITHUB_TOKEN`: GitHub Personal Access Token (required)
- `DEBUG`: Enable debug logging (optional)
- `PORT`: Override default port (optional)

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
│   └── page.tsx       # Main page
├── lib/               # Utility libraries
│   ├── github.ts      # GitHub API integration
│   ├── hash.ts        # Hash utilities
│   └── news.ts        # News feed logic
├── public/            # Static assets
└── vercel.json        # Vercel configuration
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
