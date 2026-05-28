import { Suspense } from "react";
import { LoginPageContent } from "./login-page-content";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const isDevelopment = process.env.NODE_ENV === "development";
  const credentialsLoginEnabled = isDevelopment || process.env.AUTH_ENABLE_CREDENTIALS === "true";
  const showGoogleButton =
    process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_OAUTH_IN_DEV === "true";

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent
        showGoogleButton={showGoogleButton}
        showCredentialsForm={credentialsLoginEnabled}
        showDevelopmentCredentialsNotice={isDevelopment && credentialsLoginEnabled}
      />
    </Suspense>
  );
}
