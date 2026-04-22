import { TokenStateCard } from '@/components/approval-email/token-state-card';
import { LeaveRequestSummaryCard } from '@/components/approval-email/request-summary';
import { getActionTokenState } from '@/lib/token';

export default async function ApprovePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenState = await getActionTokenState(token);

  if (tokenState.kind === 'expired' || tokenState.kind === 'invalid') {
    return (
      <TokenStateCard
        title="This link has expired"
        description="The approval link is no longer valid. Request a fresh email or sign in to process the request manually."
      />
    );
  }

  if (tokenState.kind === 'processed') {
    const leaveRequest = tokenState.leaveRequest!;
    const processedAt = leaveRequest.decidedAt
      ? new Intl.DateTimeFormat('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(leaveRequest.decidedAt)
      : 'an earlier time';

    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <LeaveRequestSummaryCard
            leaveRequest={leaveRequest}
            title="This request was already processed"
            description={`This request was already processed on ${processedAt}. The final status is ${leaveRequest.status.toUpperCase()}.`}
          />
        </div>
      </div>
    );
  }

  const leaveRequest = tokenState.leaveRequest!;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <LeaveRequestSummaryCard
          leaveRequest={leaveRequest}
          title="Approval link ready"
          description="The token is valid and the request is still pending review."
        />
      </div>
    </div>
  );
}
