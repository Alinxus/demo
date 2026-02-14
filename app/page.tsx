'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Brain, Upload, Send, Loader2, Sparkles, Zap, RotateCcw, FileSpreadsheet, CheckCircle2, MessageSquare, Table2, Users, Gauge, X, File, Database, Eye, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import ReactMarkdown from 'react-markdown';

const SAMPLE_CSV = `name,email,phone,date,amount,status
John Smith,john@email.com,555-1234,2024-01-15,150.00,active
Jane Doe,jane@email.com,555-5678,2024-01-16,200.50,active
Bob Wilson,bob@email.com,NULL,2024-01-17,NULL,pending
Alice Brown,alice@email.com,555-9012,2024-01-18,75.25,active
Charlie Davis,charlie@email.com,555-3456,NULL,300.00,active
Eva Martinez,eva@email.com,NULL,2024-01-20,125.75,pending
Frank Johnson,frank@email.com,555-7890,2024-01-21,NULL,active
Grace Lee,grace@email.com,NULL,2024-01-22,450.00,active`;

export default function Home() {
  const [userId, setUserId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    let uid = localStorage.getItem('whisper-user-id');
    if (!uid) {
      uid = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('whisper-user-id', uid);
    }
    setUserId(uid);

    let sid = localStorage.getItem('whisper-session-id');
    if (!sid) {
      sid = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('whisper-session-id', sid);
    }
    setSessionId(sid);
  }, []);

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; csvData?: string; fileName?: string; memoryStats?: { used: boolean; memoriesFound: number; queryLatencyMs: number; topScore: number } }>>([
    {
      role: 'assistant',
      content: "Hey! I'm your data analyst with perfect memory. Upload a CSV or use the sample data, then ask me anything—cleaning, analysis, transformations. I'll remember your preferences forever.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [showFileIndicator, setShowFileIndicator] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [memories, setMemories] = useState<Array<{content: string; metadata: any; score: number}>>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const downloadCSV = (csvData: string, fileName: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const loadSampleData = () => {
    setCsvData(SAMPLE_CSV);
    setFileName('sample_data.csv');
    setShowFileIndicator(true);
    
    const parsed = Papa.parse(SAMPLE_CSV, { header: true, preview: 5 });
    const preview = Papa.unparse(parsed.data);

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: '📊 Loaded sample data',
      },
      {
        role: 'assistant',
        content: `Here's the sample data (8 rows with some messy fields):\n\n\`\`\`\n${preview}\n\`\`\`\n\nTry asking me to:\n- Clean up NULL values\n- Format dates consistently\n- Find duplicates\n- Anything else!`,
      },
    ]);
  };

  const clearFile = () => {
    setCsvData(null);
    setFileName(null);
    setShowFileIndicator(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('whisper-messages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('whisper-messages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.length > 1) {
            setMessages(parsed);
          }
        } catch (e) {
          console.error('Failed to load messages');
        }
      }
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    setCsvData(text);
    setFileName(file.name);
    setShowFileIndicator(true);

    const parsed = Papa.parse(text, { header: true, preview: 10 });
    const preview = Papa.unparse(parsed.data);

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: `📊 Uploaded: ${file.name}`,
      },
      {
        role: 'assistant',
        content: `Nice! ${parsed.data.length}+ rows. Here's what I'm working with:\n\n\`\`\`\n${preview}\n\`\`\`\n\nWhat should I do with it?`,
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || !userId || !sessionId) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          csvData,
          sessionId,
          userId,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          csvData: data.csvData,
          fileName: data.fileName,
          memoryStats: data.memoryStats,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Try again?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
      handleSend();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSend();
    }
  };

  const resetSession = () => {
    if (confirm('Clear chat history? Your memories stay saved.')) {
      localStorage.removeItem('whisper-session-id');
      localStorage.removeItem('whisper-messages');
      window.location.reload();
    }
  };

  const resetUser = () => {
    if (confirm('Switch to a new user? You\'ll get fresh memory (old one stays isolated).')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const fetchMemories = async () => {
    setShowMemories(true);
    setLoadingMemories(true);
    try {
      const res = await fetch(`/api/memories?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      setMemories(data.memories || []);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      setMemories([]);
    } finally {
      setLoadingMemories(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-900/20 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-emerald-900/20 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <header className="relative sticky top-0 z-50 border-b border-white/5 bg-[#0D0D0D]/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Whisper</span>
            </div>
            <span className="text-white/20">×</span>
            <span className="text-lg font-medium text-white/80">Decide.ai</span>
            <span className="ml-2 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60 uppercase tracking-wider">Demo</span>
          </div>
          
          {fileName && (
            <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1 text-xs">
              <File className="h-3 w-3 text-white/50" />
              <span className="text-white/70">{fileName}</span>
              <button onClick={clearFile} className="hover:text-white">
                <X className="h-3 w-3 text-white/40" />
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMemories}
              className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition"
            >
              <Eye className="h-3 w-3" />
              <span>My Memories</span>
            </button>
            <button
              onClick={resetSession}
              className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <button
              onClick={resetUser}
              className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition"
            >
              <span>New User</span>
            </button>
          </div>
        </div>
      </header>

      {/* Memories Modal */}
      {showMemories && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMemories(false)} />
          <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-white/70" />
                <span className="font-medium text-white">Your Stored Memories</span>
              </div>
              <button
                onClick={() => setShowMemories(false)}
                className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 max-h-[60vh]">
              {loadingMemories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                </div>
              ) : memories.length === 0 ? (
                <div className="py-8 text-center text-white/40">
                  <Database className="mx-auto h-8 w-8 mb-2" />
                  <p>No memories stored yet.</p>
                  <p className="text-sm">Start chatting and I'll remember your preferences!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memories.map((mem, i) => (
                    <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-white/40 mb-2">
                        Score: {mem.score?.toFixed(2)} • {mem.metadata?.session_id || 'Unknown session'}
                      </div>
                      <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono">{mem.content}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-white/10 p-4">
              <p className="text-xs text-white/40 text-center">
                These are the memories Whisper stores for you. Each entry contains your conversation context.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl mb-3">
            Your data analyst with{' '}
            <span className="text-white">perfect memory</span>
          </h1>
          <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
            Upload CSV files. Ask questions in plain English. 
            I learn your preferences and apply them forever—isolated per user.
          </p>
          
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs">
              <span className="text-white/40">ID:</span>
              <span className="font-mono text-white/70">{userId ? userId.slice(0, 10) + '...' : '...'}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400">Memory Active</span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={loadSampleData}
            className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <Table2 className="h-3.5 w-3.5" />
            Load Sample Data
          </button>
          
          <div className="flex items-center gap-1">
            {['Clean NULLs', 'Remove Duplicates', 'Format Dates'].map((action) => (
              <button
                key={action}
                onClick={() => {
                  setInput(action);
                }}
                className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/10 hover:text-white transition"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-[#141414] shadow-2xl">
          <div className="flex flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[450px]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-white text-black'
                        : msg.memoryStats?.used 
                          ? 'bg-violet-500/10 border border-violet-500/30 text-white/90'
                          : 'bg-white/5 border border-white/10 text-white/90'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-white/40">
                        <MessageSquare className="h-3 w-3" />
                        <span>Whisper</span>
                        {msg.memoryStats?.used && (
                          <span className="ml-2 flex items-center gap-1 text-violet-400">
                            <Database className="h-3 w-3" />
                            Memory used
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Whisper Stats Badge */}
                    {msg.memoryStats && msg.memoryStats.used && (
                      <div className="mb-2 flex items-center gap-2 text-[10px] text-violet-400 bg-violet-500/10 rounded-md px-2 py-1 w-fit">
                        <Brain className="h-3 w-3" />
                        <span>Whisper retrieved {msg.memoryStats.memoriesFound} memory</span>
                      </div>
                    )}
                    <div className="leading-relaxed">
                      <ReactMarkdown 
                        components={{
                          code: ({className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '')
                            const isInline = !match
                            return isInline ? (
                              <code className="bg-white/10 rounded px-1 py-0.5 text-xs" {...props}>{children}</code>
                            ) : (
                              <pre className="bg-black/30 rounded-lg p-3 overflow-x-auto my-2 text-xs">
                                <code className={className} {...props}>{children}</code>
                              </pre>
                            )
                          },
                          ul: ({children}) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-white/80">{children}</li>,
                          strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                          p: ({children}) => <p className="my-2">{children}</p>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    
                    {msg.csvData && msg.fileName && (
                      <div className="mt-3 pt-2 border-t border-white/10">
                        <button
                          onClick={() => downloadCSV(msg.csvData!, msg.fileName!)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 text-xs font-medium transition"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          Download {msg.fileName}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                    <span className="text-xs text-white/40">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
                    <Upload className="h-4 w-4 text-white/50" />
                  </div>
                </label>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything... (Cmd+Enter to send)"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/10 focus:outline-none focus:ring-0 transition"
                  disabled={loading}
                />

                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    <Send className="h-4 w-4 text-black" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-white/10">
              <Brain className="h-4 w-4 text-white/70" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-white">Learns & Remembers</h3>
            <p className="text-xs text-white/40">
              Preferences saved per user, applied automatically
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-white/10">
              <Users className="h-4 w-4 text-white/70" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-white">Isolated by User</h3>
            <p className="text-xs text-white/40">
              Your data never leaks to other users
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-white/10">
              <Gauge className="h-4 w-4 text-white/70" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-white">Instant Response</h3>
            <p className="text-xs text-white/40">
              Sub-200ms memory retrieval
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
