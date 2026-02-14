# 🔥 Whisper × Decide - REAL AI Agent Demo

**A production-grade conversational AI agent with perfect memory**

This is NOT a toy demo. This is a real AI-powered Excel agent that:
- ✨ Talks naturally (powered by GPT-4 Turbo)
- 🧠 Remembers EVERYTHING (powered by Whisper)
- 📊 Actually cleans and analyzes CSV data
- 💬 Has natural conversations
- 🎨 Matches Whisper's actual design

## 🚀 Quick Start

### 1. Set Up API Keys

Edit `.env.local`:
```env
WHISPER_API_KEY=your_whisper_key
WHISPER_API_BASE_URL=http://localhost:4000
OPENAI_API_KEY=sk-...  # Get from platform.openai.com
```

### 2. Start Whisper API
In main whisper folder:
```bash
npm run dev
```

### 3. Run the Demo
```bash
npm run dev
```

Open: **http://localhost:3001**

## 💬 How It Works

### The Magic:

1. **User uploads CSV** → Agent sees the data
2. **User asks: "Clean the dates and currency"** → GPT-4 processes with Whisper context
3. **Whisper stores the preference** → Session memory saved
4. **User uploads NEW CSV next week** → Whisper retrieves old preferences
5. **User asks: "Do the same thing"** → Agent knows exactly what to do!

### Session-Based Memory

- Each conversation has a `sessionId`
- All interactions stored in Whisper with metadata
- Memory retrieved based on semantic similarity
- Works across sessions, users, and time

## 🎨 Design

Matches Whisper's actual product design:
- Clean white background `#FAFAF9`
- Primary color `#6366F1` (indigo)
- Neutral grays for text
- Rounded corners, subtle shadows
- Professional typography

## 🎯 Demo Script

### Opening (30 seconds)
> "This is a real AI agent powered by Whisper memory. Watch how it remembers your preferences forever."

### Demo Flow (3 minutes)

**Step 1:** Upload `public/samples/sales_q4_messy.csv`

**Agent says:** Shows preview, asks what to do

**Step 2:** Type: "Clean the dates to YYYY-MM-DD format, convert all currency to USD, and remove duplicates"

**Agent responds:** Explains what it will do

**Step 3:** (Simulate coming back later) Type: "I have new data with the same issues. Do the same cleaning you did last time."

**🔥 THE MAGIC:** Agent retrieves memory and knows exactly what to do!

## 🧠 How Memory Works

### Storage:
```typescript
await whisper.ingest(projectId, [{
  content: "User prefers YYYY-MM-DD dates, USD currency...",
  metadata: {
    user_id: 'demo_user',
    session_id: 'session-123',
    type: 'conversation'
  }
}]);
```

### Retrieval:
```typescript
const memory = await whisper.query({
  project: projectId,
  query: userMessage + " preferences",
  hybrid: true
});
```

### Injection:
Memory gets added to GPT-4's system prompt automatically!

## 💰 Value Pitch

**Without Whisper:**
- User: "Clean dates to YYYY-MM-DD, convert to USD, remove dupes"
- *2 weeks later*
- User: "Clean dates to YYYY-MM-DD, convert to USD, remove dupes" (AGAIN!)
- = 1000 tokens every time

**With Whisper:**
- User: "Clean dates to YYYY-MM-DD, convert to USD, remove dupes"
- *2 weeks later*
- User: "Do the same thing"
- = 100 tokens (80% saved!)

## 🛠️ Tech Stack

- **Next.js 14** - Modern React framework
- **GPT-4 Turbo** - AI brain
- **Whisper SDK** - Memory layer
- **TypeScript** - Type safety
- **Tailwind** - Styling
- **Session-based** - Not just API keys!

## 🎁 What's Better Than Before

### Old Version:
- ❌ Just data cleaning (no AI)
- ❌ Manual rule selection
- ❌ Not conversational
- ❌ Looked like a prototype

### New Version:
- ✅ Real AI that talks
- ✅ Natural language commands
- ✅ Conversational interface
- ✅ Looks like a real product
- ✅ Session-based memory
- ✅ Matches Whisper's design

## 🚀 This Will Close Deals

Show them:
1. Upload CSV
2. Chat naturally: "clean this data, make dates consistent"
3. Upload different CSV later
4. Chat: "do what you did before"
5. **Agent remembers!**

Then say:
> "This is your competitive advantage. Every other Excel agent forgets. Yours remembers."

## 📞 Get Your API Keys

**Whisper:** Already have it

**OpenAI:** https://platform.openai.com
- Sign up / Login
- Go to API keys section
- Create new key
- Add to `.env.local`

## 🎉 You're Ready!

This is a REAL product that enterprise clients will love.

**Now go close that deal!** 💰
