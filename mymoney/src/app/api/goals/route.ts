import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Goal } from '@/lib/db/models';

// GET all goals for a user
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';

        const goals = await Goal.find({ userId }).sort({ targetDate: 1 });
        return NextResponse.json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }
}

// POST create new goal
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const body = await request.json();

        const goal = await Goal.create({
            ...body,
            userId,
            targetDate: new Date(body.targetDate),
        });

        return NextResponse.json(goal, { status: 201 });
    } catch (error) {
        console.error('Error creating goal:', error);
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }
}

// PUT update goal
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const body = await request.json();
        const { _id, ...updateData } = body;

        if (updateData.targetDate) {
            updateData.targetDate = new Date(updateData.targetDate);
        }

        // Auto-complete goal if target reached
        if (updateData.currentAmount && updateData.targetAmount) {
            if (updateData.currentAmount >= updateData.targetAmount) {
                updateData.status = 'completed';
            }
        }

        const goal = await Goal.findOneAndUpdate(
            { _id, userId },
            updateData,
            { new: true }
        );

        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        return NextResponse.json(goal);
    } catch (error) {
        console.error('Error updating goal:', error);
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }
}

// DELETE goal
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
        }

        const goal = await Goal.findOneAndDelete({ _id: id, userId });

        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting goal:', error);
        return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }
}
