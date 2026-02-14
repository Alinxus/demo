import { NextRequest, NextResponse } from 'next/server';
import { whisperClient, getOrCreateProject } from '@/lib/whisper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const projectId = await getOrCreateProject();

    // Query all memories for this user
    const memoryResult = await whisperClient.query({
      project: projectId,
      query: 'conversation',
      top_k: 50,
      hybrid: true,
      metadata_filter: {
        user_id: userId,
      },
    });

    // Handle different response formats
    const results = memoryResult.results || memoryResult.data || memoryResult.memories || [];
    
    return NextResponse.json({
      success: true,
      memories: results,
    });
  } catch (error: any) {
    console.error('Get memories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
