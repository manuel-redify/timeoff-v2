import { v4 as uuidv4 } from 'uuid';
import prisma from './prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import type { Prisma } from '@/lib/generated/prisma/client';

type LeaveRequestTokenClient = {
  leaveRequest: {
    update(args: {
      where: { id: string };
      data: { actionToken: string; actionTokenExpiry: Date };
    }): Promise<unknown>;
  };
};

type ActionTokenLeaveRequest = Prisma.LeaveRequestGetPayload<{
  include: {
    user: true;
    approver: true;
    leaveType: true;
  };
}>;

export type ActionTokenState =
  | {
      kind: 'valid';
      leaveRequest: ActionTokenLeaveRequest;
    }
  | {
      kind: 'expired' | 'processed' | 'invalid';
      leaveRequest: ActionTokenLeaveRequest | null;
    };

/**
 * Generate a secure action token for email approval/rejection links
 * @param leaveRequestId ID of the leave request
 * @param approverId ID of the designated approver
 * @param expiresInDays Token validity period (default: 7 days)
 * @returns Generated token string
 */
export async function generateActionToken(
  leaveRequestId: string,
  approverId: string,
  expiresInDays: number = 7,
  client: LeaveRequestTokenClient = prisma
): Promise<string> {
  // Generate a UUID-based token
  const token = uuidv4();
  
  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiresInDays);
  
  // Update the leave request with the token and expiry
  await client.leaveRequest.update({
    where: { id: leaveRequestId },
    data: {
      actionToken: token,
      actionTokenExpiry: expiryDate,
    },
  });
  
  return token;
}

/**
 * Validate an action token and return associated data if valid
 * @param token The token to validate
 * @returns LeaveRequest data if valid, null otherwise
 */
export async function validateActionToken(token: string) {
  if (!token) return null;
  
  const leaveRequest = await prisma.leaveRequest.findFirst({
    where: {
      actionToken: token,
      actionTokenExpiry: {
        gt: new Date(), // Token must not be expired
      },
      status: LeaveStatus.NEW, // Only valid for pending requests
    },
    include: {
      user: true,
      approver: true,
      leaveType: true,
    },
  });
  
  if (!leaveRequest) return null;
  
  // Additional security: Check if token matches expected approver
  // This prevents token reuse by unauthorized users
  // Note: In a real implementation, you'd also store approverId in token payload
  // For now, we rely on the token being single-use via invalidation after use
  
  return leaveRequest;
}

export async function getActionTokenState(token: string): Promise<ActionTokenState> {
  if (!token) {
    return { kind: 'invalid', leaveRequest: null };
  }

  const leaveRequest = await prisma.leaveRequest.findFirst({
    where: {
      actionToken: token,
    },
    include: {
      user: true,
      approver: true,
      leaveType: true,
    },
  });

  if (!leaveRequest) {
    return { kind: 'invalid', leaveRequest: null };
  }

  if (!leaveRequest.actionTokenExpiry || leaveRequest.actionTokenExpiry <= new Date()) {
    return { kind: 'expired', leaveRequest };
  }

  if (leaveRequest.status !== LeaveStatus.NEW) {
    return { kind: 'processed', leaveRequest };
  }

  return { kind: 'valid', leaveRequest };
}

/**
 * Invalidate an action token (mark as used)
 * @param token The token to invalidate
 */
export async function invalidateActionToken(token: string) {
  await prisma.leaveRequest.updateMany({
    where: { actionToken: token },
    data: {
      actionToken: null,
      actionTokenExpiry: null,
    },
  });
}
