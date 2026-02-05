# Google OAuth Setup Guide

**Version:** v1  
**Date:** 2026-01-30  
**Purpose:** Complete guide for configuring Google OAuth with TimeOff Management System

## 📋 Prerequisites

- Google Cloud Console account with administrator privileges
- Your application's production domain (e.g., `https://yourcompany.com`)
- Access to your TimeOff application's environment configuration

## 🌐 Google Cloud Console Setup

### 1. Create/Select Project

1. **Navigate to Google Cloud Console**
   - Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create New Project or Select Existing**
   ```
   Click project selector (top left) → "NEW PROJECT"
   Project name: "TimeOff Management"
   Organization: Select your organization
   Click "CREATE"
   ```

### 2. Configure OAuth Consent Screen

1. **Navigate to OAuth Consent Screen**
   ```
   Go to "APIs & Services" → "OAuth consent screen"
   Choose "External" (for public-facing application)
   ```

2. **Fill in Application Information**
   ```
   App name: "TimeOff Management"
   User support email: "support@yourcompany.com"
   Application home page: "https://yourcompany.com"
   Application privacy policy link: "https://yourcompany.com/privacy"
   Application terms of service link: "https://yourcompany.com/terms"
   
   Developer contact information:
     Email: "dev-team@yourcompany.com"
   ```

3. **Configure Scopes**
   ```
   Click "ADD OR REMOVE SCOPES"
   Add the following scopes:
   - openid
   - email
   - profile
   Click "UPDATE"
   ```

### 3. Create OAuth 2.0 Credentials

1. **Navigate to Credentials Page**
   ```
   "APIs & Services" → "Credentials"
   Click "+ CREATE CREDENTIALS" → "OAuth 2.0 Client IDs"
   ```

2. **Configure Web Application**
   ```
   Application type: Web application
   Name: "TimeOff Web App"
   
   Authorized JavaScript origins:
   - Development: http://localhost:3000
   - Development: http://localhost:3001
   - Staging: https://staging.yourcompany.com
   - Production: https://yourcompany.com
   
   Authorized redirect URIs:
   - Development: http://localhost:3000/api/auth/callback/google
   - Development: http://localhost:3001/api/auth/callback/google
   - Staging: https://staging.yourcompany.com/api/auth/callback/google
   - Production: https://yourcompany.com/api/auth/callback/google
   - Production: https://yourcompany.com/login (fallback)
   ```

3. **Save and Copy Credentials**
   ```
   Click "CREATE"
   IMPORTANT: Copy and save your Client ID and Client Secret immediately
   You cannot retrieve the Client Secret later!
   ```

## 🔑 Environment Configuration

### Development Environment

Add to your `.env.local` file:

```env
# Enable OAuth in development (optional)
ENABLE_OAUTH_IN_DEV="true"

# Google OAuth Credentials
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-generated-client-secret"
```

### Production Environment

Add to your production environment variables:

```env
# Google OAuth Credentials (Required)
AUTH_GOOGLE_ID="your-production-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-production-client-secret"

# Force production mode
NODE_ENV="production"
```

### Security Notes

- **Never commit** `AUTH_GOOGLE_SECRET` to version control
- **Use different credentials** for development, staging, and production
- **Store secrets securely** using your hosting provider's secret management
- **Rotate secrets regularly** following your security policies

## 🌍 Domain and Redirect Configuration

### Domain Requirements

Your domain must be:
- **Accessible** via HTTPS (required for production)
- **Configured** in Google Cloud Console
- **CORS enabled** for your application domain

### Redirect URI Explanation

The TimeOff application uses these redirect URIs:

#### Primary Redirect
```
https://yourdomain.com/api/auth/callback/google
```
This is where Google redirects users after authentication.

#### Fallback Redirect
```
https://yourdomain.com/login
```
Used if the primary redirect fails or is unreachable.

### Development Setup

For local development, you can use:
```
http://localhost:3000/api/auth/callback/google
```

## 🧪 Testing OAuth Configuration

### 1. Development Testing

1. **Enable OAuth in Dev**
   ```env
   ENABLE_OAUTH_IN_DEV="true"
   ```

2. **Restart Development Server**
   ```bash
   npm run dev
   ```

3. **Test Google Sign-In**
   - Navigate to `/login`
   - Click "Sign in with Google"
   - Complete Google authentication flow
   - Verify redirect back to your application

### 2. Production Testing

1. **Deploy Application**
   - Deploy your application to production
   - Ensure all environment variables are set correctly

2. **Test OAuth Flow**
   - Visit your production URL
   - Click "Sign in with Google"
   - Verify complete authentication flow

## 🔍 Troubleshooting

### Common Issues and Solutions

#### "redirect_uri_mismatch" Error
```
Problem: The redirect URI doesn't match authorized URIs
Solution: 
1. Check your Google Cloud Console settings
2. Ensure exact match (including protocol and path)
3. Verify no trailing slashes differences
4. Check environment variable values
```

#### "invalid_client" Error
```
Problem: Client ID is incorrect or disabled
Solution:
1. Verify AUTH_GOOGLE_ID matches Google Console
2. Check if OAuth app is enabled
3. Ensure no extra spaces or characters
```

#### "access_denied" Error
```
Problem: User denied access or scopes insufficient
Solution:
1. Verify required scopes (openid, email, profile)
2. Check OAuth consent screen configuration
3. User may need to re-consent with correct scopes
```

### Debug Tips

1. **Check Google OAuth Logs**
   - Go to Google Cloud Console → APIs & Services → OAuth 2.0
   - Review recent activity and errors

2. **Verify Environment Variables**
   ```bash
   # Test your configuration
   echo $AUTH_GOOGLE_ID
   echo $AUTH_GOOGLE_SECRET
   ```

3. **Check Application Logs**
   - Review Next.js development server logs
   - Check browser console for JavaScript errors
   - Monitor network requests in browser dev tools

## 🔧 Advanced Configuration

### Custom Scopes

The TimeOff application requires these scopes:
- `openid`: For user authentication
- `email`: Access user's email address
- `profile`: Basic profile information

### Domain Verification

For production deployment:
1. **Add domain** to Google Search Console
2. **Upload verification file** or configure DNS
3. **Verify ownership** through Google Console

## 📞 Support

If you encounter issues:

1. **Check Documentation**: Review this guide thoroughly
2. **Verify Configuration**: Double-check all environment variables
3. **Test Development**: Reproduce issue in development environment
4. **Create Issue**: File bug report with:
   - Error messages (screenshots preferred)
   - Environment (dev/staging/production)
   - Steps to reproduce
   - Current configuration

### Useful Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [TimeOff Application Documentation](../README.md)

---

**Next Steps:**
- After configuring OAuth, test the complete authentication flow
- Verify user accounts are linked correctly in the database
- Update your application's user management workflows