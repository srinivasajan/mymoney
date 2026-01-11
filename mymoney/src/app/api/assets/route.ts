import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Asset } from '@/lib/db/models';

// GET all assets for a user
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';

        const assets = await Asset.find({ userId }).sort({ createdAt: -1 });
        return NextResponse.json(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
        return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }
}

// POST create new asset
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const body = await request.json();

        const asset = await Asset.create({
            ...body,
            userId,
        });

        return NextResponse.json(asset, { status: 201 });
    } catch (error) {
        console.error('Error creating asset:', error);
        return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
    }
}

// PUT update asset
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const body = await request.json();
        const { _id, ...updateData } = body;

        const asset = await Asset.findOneAndUpdate(
            { _id, userId },
            updateData,
            { new: true }
        );

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        return NextResponse.json(asset);
    } catch (error) {
        console.error('Error updating asset:', error);
        return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
    }
}

// DELETE asset
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
        }

        const asset = await Asset.findOneAndDelete({ _id: id, userId });

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting asset:', error);
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}
