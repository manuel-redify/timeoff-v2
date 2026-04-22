'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface RejectRequestFormProps {
  token: string;
  requesterName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: string;
}

interface RejectResponse {
  success?: boolean;
  error?: string;
  decidedAt?: string;
}

const MIN_COMMENT_LENGTH = 10;

export function RejectRequestForm({
  token,
  requesterName,
  leaveType,
  startDate,
  endDate,
  duration,
}: RejectRequestFormProps) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<RejectResponse | null>(null);

  const trimmedLength = comment.trim().length;
  const isValid = trimmedLength >= MIN_COMMENT_LENGTH;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      setError('Please provide a meaningful reason for rejection (minimum 10 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          comment: comment.trim(),
        }),
      });

      const result = (await response.json()) as RejectResponse;

      if (!response.ok) {
        setError(result.error ?? 'Failed to reject leave request.');
        return;
      }

      setSuccessData(result);
    } catch {
      setError('Failed to reject leave request.');
    } finally {
      setSubmitting(false);
    }
  }

  if (successData?.success) {
    return (
      <Card className="border-red-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
            <CircleX className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl leading-tight sm:text-2xl">
              Request rejected successfully
            </CardTitle>
            <CardDescription className="text-sm leading-6 sm:text-[15px]">
              The request has been rejected and the email action token is no longer valid.
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
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Supervisor comment</div>
            <div className="break-words font-medium">{comment.trim()}</div>
          </div>
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
        <CardTitle className="text-xl leading-tight sm:text-2xl">Confirm rejection</CardTitle>
        <CardDescription className="text-sm leading-6 sm:text-[15px]">
          Add a mandatory comment before rejecting the request.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="rejection-comment" className="text-sm font-medium">
              Reason for rejection
            </label>
            <Textarea
              id="rejection-comment"
              name="comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              required
              rows={5}
              className="min-h-32 resize-y text-sm leading-6 sm:text-[15px]"
              placeholder="Explain why this request is being rejected."
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Minimum {MIN_COMMENT_LENGTH} characters.</span>
              <span>{trimmedLength}/{MIN_COMMENT_LENGTH}</span>
            </div>
          </div>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="submit"
            variant="destructive"
            className="min-h-11 w-full sm:w-auto"
            disabled={submitting || !isValid}
          >
            {submitting ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
