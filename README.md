# Whisper Memory Demo

A production-ready demo showcasing Whisper's memory capabilities for AI agents.

## What It Does

This demo shows how Whisper adds long-term memory to AI agents:
- **Preference Learning** - Remembers user preferences across sessions
- **User Isolation** - Each user's memory is completely separate
- **Semantic Search** - Retrieves relevant context using vector embeddings

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variables in .env.local
WHISPER_API_KEY=your_key
WHISPER_API_BASE_URL=https://context.usewhisper.dev
OPENAI_API_KEY=sk-...

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Features

- Upload CSV files and chat with an AI data analyst
- AI remembers your preferences and applies them to future sessions
- Download cleaned/transformed CSV data
- View and delete your stored memories
- Multi-user isolation - each user has separate memory

## Tech Stack

- Next.js 14
- Whisper Memory API
- OpenAI GPT-4
- Tailwind CSS

## Deployment

Deploy to Vercel:
```bash
# Connect your GitHub repo to Vercel
# Add environment variables
# Deploy
```

## API Reference

### Whisper Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/projects/:id/ingest` | Store memory with metadata |
| `POST /v1/context/query` | Retrieve memory via vector search |

### Key Parameters

- `metadata_filter` - Filter by user_id for isolation
- `hybrid` - Enable hybrid vector + keyword search
- `top_k` - Number of memories to retrieve

## Security & Privacy

- User data is isolated by API key and user_id metadata
- Memories can be deleted via the UI or API
- Data encrypted at rest via database provider
