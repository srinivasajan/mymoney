import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Investment } from '@/lib/db/models';

// GET all investments for a user
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';

        const investments = await Investment.find({ userId }).sort({ createdAt: -1 });
        return NextResponse.json(investments);
    } catch (error) {
        console.error('Error fetching investments:', error);
        return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 });
    }
}

// POST create new investment
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const body = await request.json();

        // Calculate derived fields
        const investedAmount = body.quantity * body.avgBuyPrice;
        const currentValue = body.quantity * body.currentPrice;
        const returns = currentValue - investedAmount;
        const returnsPercent = investedAmount > 0 ? (returns / investedAmount) * 100 : 0;

        const investment = await Investment.create({
            ...body,
            userId,
            investedAmount,
            currentValue,
            returns,
            returnsPercent,
        });

        return NextResponse.json(investment, { status: 201 });
    } catch (error) {
        console.error('Error creating investment:', error);
        return NextResponse.json({ error: 'Failed to create investment' }, { status: 500 });
    }
}

// PUT update investment
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const body = await request.json();
        const { _id, ...updateData } = body;

        // Recalculate derived fields if price/quantity changed
        if (updateData.quantity && updateData.avgBuyPrice && updateData.currentPrice) {
            updateData.investedAmount = updateData.quantity * updateData.avgBuyPrice;
            updateData.currentValue = updateData.quantity * updateData.currentPrice;
            updateData.returns = updateData.currentValue - updateData.investedAmount;
            updateData.returnsPercent = updateData.investedAmount > 0
                ? (updateData.returns / updateData.investedAmount) * 100
                : 0;
        }

        const investment = await Investment.findOneAndUpdate(
            { _id, userId },
            updateData,
            { new: true }
        );

        if (!investment) {
            return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
        }

        return NextResponse.json(investment);
    } catch (error) {
        console.error('Error updating investment:', error);
        return NextResponse.json({ error: 'Failed to update investment' }, { status: 500 });
    }
}

// DELETE investment
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Investment ID required' }, { status: 400 });
        }

        const investment = await Investment.findOneAndDelete({ _id: id, userId });

        if (!investment) {
            return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting investment:', error);
        return NextResponse.json({ error: 'Failed to delete investment' }, { status: 500 });
    }
}
