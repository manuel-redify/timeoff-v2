'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleCheckBig } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ApproveRequestFormProps {
  token: string;
  requesterName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: string;
}

interface ApproveResponse {
  success?: boolean;
  error?: string;
  decidedAt?: string;
  isFinalApproval?: boolean;
}

export function ApproveRequestForm({
  token,
  requesterName,
  leaveType,
  startDate,
  endDate,
  duration,
}: ApproveRequestFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ApproveResponse | null>(null);

  async function handleApprove() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = (await response.json()) as ApproveResponse;

      if (!response.ok) {
        setError(result.error ?? 'Failed to approve leave request.');
        return;
      }

      setSuccessData(result);
    } catch {
      setError('Failed to approve leave request.');
    } finally {
      setSubmitting(false);
    }
  }

  if (successData?.success) {
    return (
      <Card className="border-emerald-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CircleCheckBig className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl leading-tight sm:text-2xl">
              {successData.isFinalApproval ? 'Request approved successfully' : 'Approval step completed'}
            </CardTitle>
            <CardDescription className="text-sm leading-6 sm:text-[15px]">
              {successData.isFinalApproval
                ? 'The request has been approved and the email action token is no longer valid.'
                : 'Your approval was recorded. The request is still pending any remaining workflow steps.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 text-sm leading-6 sm:text-[15px]">
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Employee</div>
            <div className="font-medium">{requesterName}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide">Start date</div>
              <div className="font-medium">{startDate}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide">End date</div>
              <div className="font-medium">{endDate}</div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide">Leave type</div>
              <div className="font-medium">{leaveType}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide">Duration</div>
              <div className="font-medium">{duration}</div>
            </div>
          </div>
          {successData.decidedAt && (
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide">Processed on</div>
              <div className="font-medium">{successData.decidedAt}</div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl leading-tight sm:text-2xl">Confirm approval</CardTitle>
        <CardDescription className="text-sm leading-6 sm:text-[15px]">
          Confirm this action to approve the leave request.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          className="min-h-11 w-full sm:w-auto"
          disabled={submitting}
          onClick={handleApprove}
        >
          {submitting ? 'Approving...' : 'Approve Now'}
        </Button>
      </CardFooter>
    </Card>
  );
}
