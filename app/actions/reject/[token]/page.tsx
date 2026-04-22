import { TokenStateCard } from '@/components/approval-email/token-state-card';
import { LeaveRequestSummaryCard } from '@/components/approval-email/request-summary';
import { RejectRequestForm } from '@/components/approval-email/reject-request-form';
import { getActionTokenState } from '@/lib/token';

export default async function RejectPage({
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
        description="The rejection link is no longer valid. Request a fresh email or sign in to handle the request manually."
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
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <LeaveRequestSummaryCard
          leaveRequest={leaveRequest}
          title="Rejection link ready"
          description="The token is valid and the request is still pending review."
        />
        <RejectRequestForm
          token={token}
          requesterName={`${leaveRequest.user.name} ${leaveRequest.user.lastname}`}
          leaveType={leaveRequest.leaveType.name}
          startDate={new Intl.DateTimeFormat('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(leaveRequest.dateStart)}
          endDate={new Intl.DateTimeFormat('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(leaveRequest.dateEnd)}
          duration={
            leaveRequest.durationMinutes % 480 === 0
              ? `${leaveRequest.durationMinutes / 480} ${leaveRequest.durationMinutes / 480 === 1 ? 'day' : 'days'}`
              : leaveRequest.durationMinutes >= 60
                ? `${Math.floor(leaveRequest.durationMinutes / 60)}h ${leaveRequest.durationMinutes % 60}m`
                : `${leaveRequest.durationMinutes}m`
          }
        />
      </div>
    </div>
  );
}
