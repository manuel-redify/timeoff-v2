import { buildLeaveActionUrls } from '@/lib/email';
import { generateActionToken } from '@/lib/token';

export async function buildScopedLeaveActionUrls(
  leaveRequestId: string,
  approverId: string,
  baseUrl?: string
) {
  const token = await generateActionToken(leaveRequestId, approverId, 7);
  return buildLeaveActionUrls(token, baseUrl);
}
