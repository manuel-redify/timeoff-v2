import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface TokenStateCardProps {
  title: string;
  description: string;
  loginHref?: string;
}

export function TokenStateCard({
  title,
  description,
  loginHref = '/login',
}: TokenStateCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-lg border-amber-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl leading-tight sm:text-2xl">{title}</CardTitle>
            <CardDescription className="text-sm leading-6 sm:text-[15px]">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-slate-600 sm:text-[15px]">
          Use manual login to review the request from the portal.
        </CardContent>
        <CardFooter className="flex-col items-stretch sm:items-start">
          <Button asChild className="min-h-11 w-full sm:w-auto">
            <Link href={loginHref}>Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
