"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, Chrome, AlertTriangle } from "lucide-react";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isProduction = process.env.NODE_ENV === "production";
  const enableOAuthInDev = mounted ? process.env.NEXT_PUBLIC_ENABLE_OAUTH_IN_DEV === "true" : false;
  const showGoogleButton = mounted ? (isProduction || enableOAuthInDev) : false;
  const showCredentialsForm = mounted ? process.env.NODE_ENV === "development" : false;

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMessage = getErrorMessage(errorParam);
      setError(errorMessage);
    }
  }, [searchParams]);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case "AccessDenied":
        return "Access denied. You don't have permission to sign in.";
      case "OAuthAccountNotLinked":
        return "This email is already linked to a different authentication method. Please use the original method to sign in.";
      case "OAuthSignin":
        return "Error in constructing an authorization URL. Please try again.";
      case "OAuthCallback":
        return "Error in handling the response from an OAuth provider. Please try again.";
      case "OAuthCreateAccount":
        return "Could not create user account. Please contact your administrator.";
      case "EmailCreateAccount":
        return "Could not create user account. Please contact your administrator.";
      case "Callback":
        return "Error in the OAuth callback handler. Please try again.";
      case "OAuthAccountNotLinked":
        return "This email is already linked to a different authentication method.";
      case "SessionRequired":
        return "Please sign in to access this page.";
      case "Configuration":
        return "There is a problem with the server configuration. Please contact your administrator.";
      case "Verification":
        return "Your email address has not been verified. Please check your inbox.";
      case "Default":
        return "An error occurred during sign in. Please try again.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    await signIn("google", { callbackUrl: "/" });
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else if (result?.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Sign in failed. Please try again.");
      }
    } catch (err) {
      setError("Sign in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-[0.0625rem] border-neutral-200 rounded-lg bg-white">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4">
            <Image
              src="/logo.svg"
              alt="TimeOff"
              width={120}
              height={38}
              priority
              unoptimized
            />
          </div>
          <CardTitle className="text-2xl font-bold text-neutral-900">Welcome Back</CardTitle>
          <CardDescription className="text-neutral-400">
            Sign in to your TimeOff Management account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="border-[0.0625rem] border-neutral-200 bg-white rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-neutral-900">{error}</p>
            </div>
          )}

          {/* Google Sign-In Button */}
          {showGoogleButton && (
            <Button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full bg-white border-[0.0625rem] border-neutral-200 text-neutral-900 hover:bg-neutral-50 hover:border-neutral-300 rounded-sm font-medium py-3"
              variant="outline"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Chrome className="w-4 h-4 mr-2" />
                  Sign in with Google
                </>
              )}
            </Button>
          )}

          {/* Divider */}
          {showGoogleButton && showCredentialsForm && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-400">or continue with</span>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          {showCredentialsForm && (
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-neutral-900">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 bg-white border-[0.0625rem] border-neutral-200 rounded-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-neutral-900">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 bg-white border-[0.0625rem] border-neutral-200 rounded-sm"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#e2f337] hover:bg-[#d4e62e] text-neutral-900 font-medium py-3 rounded-sm transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}

          {/* Development Notice */}
          {showCredentialsForm && (
            <div className="text-center">
              <p className="text-xs text-neutral-400">
                Development Mode - Use temporary password: <code className="bg-neutral-100 px-1 py-0.5 rounded-sm">TempPassword123!</code>
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-400">
              © 2026 TimeOff Management. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}