import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { whisperClient, getOrCreateProject } from '@/lib/whisper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { message, csvData, sessionId, userId, history } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const projectId = await getOrCreateProject();

    // 1. Retrieve user's memory from Whisper with USER ID FILTERING
    let memoryContext = '';
    let memoryStats = {
      used: false,
      memoriesFound: 0,
      queryLatencyMs: 0,
      topScore: 0,
    };
    const memoryStartTime = Date.now();
    
    try {
      const memoryResult = await whisperClient.query({
        project: projectId,
        query: `${message} user preferences data cleaning`,
        top_k: 5,
        hybrid: true,
        metadata_filter: {
          user_id: userId,
        },
      });

      if (memoryResult.results && memoryResult.results.length > 0) {
        memoryContext = memoryResult.results
          .map((r: any) => r.content)
          .join('\n\n');
        memoryStats = {
          used: true,
          memoriesFound: memoryResult.results.length,
          queryLatencyMs: Date.now() - memoryStartTime,
          topScore: memoryResult.results[0]?.score || 0,
        };
      }
    } catch (error) {
      console.log('No previous memory found for user:', userId);
      memoryStats.queryLatencyMs = Date.now() - memoryStartTime;
    }

    // 2. Build system prompt with CSV data and memory
    const systemPrompt = `You are an Excel AI data analyst for Decide.ai with PERFECT MEMORY powered by Whisper.

Your job: Help users analyze and clean their CSV data using natural language.

${memoryContext ? `\n## USER'S PREVIOUS PREFERENCES (FROM WHISPER MEMORY):\n${memoryContext}\n` : ''}

${csvData ? `\n## CURRENT CSV DATA:\n${csvData.substring(0, 3000)}\n` : ''}

## CAPABILITIES:
- Clean messy data (dates, currencies, duplicates)
- Analyze data patterns
- Answer questions about the data
- Transform and reshape data
- Remember user preferences across sessions
- Apply consistent rules

## OUTPUT FORMATS:
- When user asks to clean, transform, or modify data: Return the result as CSV
- Use this format for CSV output:
  [CSV_START]
  header1,header2,header3
  value1,value2,value3
  [CSV_END]
- When answering questions: Just return text, no CSV needed

## IMPORTANT:
- If user has previous preferences in memory, USE THEM automatically
- ACT IMMEDIATELY on clear requests — do not ask for confirmation. If the user says "clean NULLs", do it.
- When the user picks a numbered option you listed (e.g. "1"), execute that option right away.
- When you provide data transformations, ALWAYS include the CSV format so users can download
- When user says "do the same thing" or "like before", check memory and apply those exact preferences
- Only ask for clarification if the request is genuinely impossible to interpret.`;

    // 3. Call GPT-4o-mini with full conversation history
    const conversationHistory = Array.isArray(history)
      ? history
          .filter((m: any) => m.role === 'user' || m.role === 'assistant')
          .slice(-10) // keep last 10 turns to avoid token bloat
          .map((m: any) => ({ role: m.role, content: m.content }))
      : [];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const assistantMessage = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // 4. Extract CSV data if present
    let csvDataResult: string | undefined;
    let fileName: string | undefined;
    
    const csvMatch = assistantMessage.match(/\[CSV_START\]([\s\S]*?)\[CSV_END\]/);
    if (csvMatch) {
      csvDataResult = csvMatch[1].trim();
      fileName = `whisper_data_${Date.now()}.csv`;
    }

    // 5. Store interaction in Whisper memory WITH USER ID
    await whisperClient.ingest(projectId, [
      {
        title: `${userId} - Session ${sessionId}`,
        content: `User: ${message}\nAssistant: ${assistantMessage}\n\nTimestamp: ${new Date().toISOString()}`,
        metadata: {
          type: 'conversation',
          user_id: userId,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      message: assistantMessage.replace(/\[CSV_START\][\s\S]*?\[CSV_END\]/g, '').trim(),
      csvData: csvDataResult,
      fileName: fileName,
      memoryStats,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
