import { NextRequest, NextResponse } from 'next/server';
import { validateActionToken } from '@/lib/token';
import prisma from '@/lib/prisma';
import { EmailApprovalActionService } from '@/lib/services/email-approval-action.service';
import { getRequestBaseUrl } from '@/lib/app-url';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
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

    const baseUrl = getRequestBaseUrl(request.headers);

    const result = await EmailApprovalActionService.approveFromEmail(
      actor,
      tokenValidation.leaveRequest.id,
      baseUrl
    );

    return NextResponse.json({
      success: true,
      isFinalApproval: result.isFinalApproval,
      decidedAt: result.decidedAt
        ? new Intl.DateTimeFormat('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(result.decidedAt)
        : undefined,
    });
  } catch (error) {
    console.error('Error approving leave request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
