import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Transaction } from '@/lib/db/models';

// GET all transactions for a user
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const type = searchParams.get('type');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const query: Record<string, unknown> = { userId };

        if (type) query.type = type;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) (query.date as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (query.date as Record<string, Date>).$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query)
            .sort({ date: -1 })
            .limit(limit);

        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

// POST create new transaction
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const body = await request.json();

        const transaction = await Transaction.create({
            ...body,
            userId,
            date: new Date(body.date),
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

// PUT update transaction
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const body = await request.json();
        const { _id, ...updateData } = body;

        if (updateData.date) {
            updateData.date = new Date(updateData.date);
        }

        const transaction = await Transaction.findOneAndUpdate(
            { _id, userId },
            updateData,
            { new: true }
        );

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json(transaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }
}

// DELETE transaction
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
        }

        const transaction = await Transaction.findOneAndDelete({ _id: id, userId });

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
}
