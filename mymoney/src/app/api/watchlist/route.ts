import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { WatchlistItem } from '@/lib/db/models';

// GET all watchlist items for a user
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';

        const watchlist = await WatchlistItem.find({ userId }).sort({ addedAt: -1 });
        return NextResponse.json(watchlist);
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
    }
}

// POST add to watchlist
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const body = await request.json();

        // Check if already exists
        const existing = await WatchlistItem.findOne({ userId, symbol: body.symbol });
        if (existing) {
            return NextResponse.json({ error: 'Already in watchlist' }, { status: 400 });
        }

        const item = await WatchlistItem.create({
            ...body,
            userId,
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }
}

// DELETE from watchlist
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');

        if (!symbol) {
            return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
        }

        const item = await WatchlistItem.findOneAndDelete({ userId, symbol });

        if (!item) {
            return NextResponse.json({ error: 'Not found in watchlist' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }
}
