import { NextRequest, NextResponse } from 'next/server';
import { validateActionToken } from '@/lib/token';
import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';

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
    const leaveRequest = await validateActionToken(token);

    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if request is still pending
    if (leaveRequest.status !== LeaveStatus.NEW) {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      );
    }

    const decidedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id: leaveRequest.id },
        data: {
          status: LeaveStatus.REJECTED,
          decidedAt,
          approverComment: comment.trim(),
          approverId: leaveRequest.approverId,
        },
      });

      await tx.leaveRequest.updateMany({
        where: { actionToken: token },
        data: {
          actionToken: null,
          actionTokenExpiry: null,
        },
      });

      await tx.audit.create({
        data: {
          entityType: 'leave_request',
          entityId: leaveRequest.id,
          attribute: 'status',
          oldValue: LeaveStatus.NEW,
          newValue: JSON.stringify({
            status: LeaveStatus.REJECTED,
            source: 'Action via Email',
            approverComment: comment.trim(),
            decidedAt: decidedAt.toISOString(),
          }),
          companyId: leaveRequest.user.companyId,
          byUserId: leaveRequest.approverId,
        },
      });
    });

    // TODO: Send rejection notification email (optional, but recommended)

    return NextResponse.json({
      success: true,
      decidedAt: new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(decidedAt),
    });
  } catch (error) {
    console.error('Error rejecting leave request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
