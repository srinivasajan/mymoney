import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Liability } from '@/lib/db/models';

// GET all liabilities for a user
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';

        const liabilities = await Liability.find({ userId }).sort({ createdAt: -1 });
        return NextResponse.json(liabilities);
    } catch (error) {
        console.error('Error fetching liabilities:', error);
        return NextResponse.json({ error: 'Failed to fetch liabilities' }, { status: 500 });
    }
}

// POST create new liability
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const body = await request.json();

        const liability = await Liability.create({
            ...body,
            userId,
        });

        return NextResponse.json(liability, { status: 201 });
    } catch (error) {
        console.error('Error creating liability:', error);
        return NextResponse.json({ error: 'Failed to create liability' }, { status: 500 });
    }
}

// PUT update liability
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const body = await request.json();
        const { _id, ...updateData } = body;

        const liability = await Liability.findOneAndUpdate(
            { _id, userId },
            updateData,
            { new: true }
        );

        if (!liability) {
            return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
        }

        return NextResponse.json(liability);
    } catch (error) {
        console.error('Error updating liability:', error);
        return NextResponse.json({ error: 'Failed to update liability' }, { status: 500 });
    }
}

// DELETE liability
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Liability ID required' }, { status: 400 });
        }

        const liability = await Liability.findOneAndDelete({ _id: id, userId });

        if (!liability) {
            return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting liability:', error);
        return NextResponse.json({ error: 'Failed to delete liability' }, { status: 500 });
    }
}
