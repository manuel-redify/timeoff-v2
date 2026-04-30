import { NextRequest, NextResponse } from 'next/server';
import { validateActionToken } from '@/lib/token';
import prisma from '@/lib/prisma';
import { EmailApprovalActionService } from '@/lib/services/email-approval-action.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, comment } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a meaningful reason for rejection (minimum 10 characters)' },
        { status: 400 }
      );
    }

    // Validate token
    const tokenValidation = await validateActionToken(token);

    if (!tokenValidation) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const actor = await prisma.user.findUnique({
      where: { id: tokenValidation.approverId },
      select: { id: true, isAdmin: true, name: true, lastname: true },
    });

    if (!actor) {
      return NextResponse.json(
        { error: 'Approver not found' },
        { status: 404 }
      );
    }

    const result = await EmailApprovalActionService.rejectFromEmail(
      actor,
      tokenValidation.leaveRequest.id,
      comment
    );

    return NextResponse.json({
      success: true,
      decidedAt: new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(result.decidedAt),
    });
  } catch (error) {
    console.error('Error rejecting leave request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
