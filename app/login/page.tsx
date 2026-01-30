"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
  const searchParams = useSearchParams();
  const router = useRouter();

  const isProduction = process.env.NODE_ENV === "production";
  const enableOAuthInDev = process.env.ENABLE_OAUTH_IN_DEV === "true";
  const showGoogleButton = isProduction || enableOAuthInDev;
  const showCredentialsForm = process.env.NODE_ENV === "development";

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
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
      setGoogleLoading(false);
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
          <CardDescription className="text-slate-600">
            Sign in to your TimeOff Management account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="border-2 border-rose-200 bg-rose-50 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-rose-800">{error}</p>
            </div>
          )}

          {/* Google Sign-In Button */}
          {showGoogleButton && (
            <Button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium py-3 shadow-sm"
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
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or continue with</span>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          {showCredentialsForm && (
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 bg-white border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 bg-white border-slate-200"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 shadow-lg transition-all duration-200"
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
              <p className="text-xs text-slate-500">
                Development Mode - Use temporary password: <code className="bg-slate-100 px-1 py-0.5 rounded">TempPassword123!</code>
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
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