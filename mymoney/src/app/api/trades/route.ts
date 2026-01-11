import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { PaperTrade } from '@/lib/db/models';

// GET all trades for a user
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const trades = await PaperTrade.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit);

        return NextResponse.json(trades);
    } catch (error) {
        console.error('Error fetching trades:', error);
        return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
    }
}
