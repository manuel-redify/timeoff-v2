# Technology Stack

**Project:** TimeOff Management System Enhancements
**Researched:** February 3, 2026
**Overall confidence:** HIGH

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.2.0 | Enhanced web framework with improved performance and React 19 support | Latest stable canary release includes Turbopack improvements and React 19 compatibility |
| React | 19.0.0 | UI framework | Required for Next.js 16.2.0, improves server components and concurrent features |
| TypeScript | 5.7+ | Type safety | Latest version includes enhanced performance and new language features |

### Database Enhancement
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Prisma | 6.0+ | Enhanced ORM with better performance and new features | Latest version includes improved query optimization and type safety |
| PostgreSQL | 16+ | Relational database for balance tracking | Latest stable version with enhanced JSON support and performance |

### Calendar Integration
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Google APIs Node.js Client | 140.0.0+ | Google Calendar API integration | Official Google client with OAuth 2.0, JWT, and service account support |
| @googleapis/calendar | v3 (rev20240502) | Google Calendar API access | Specifically designed for Calendar operations with latest features |
| Microsoft Graph Client | 4.0+ | Outlook/Exchange calendar integration | Alternative for Microsoft ecosystem integration |

### Notification System
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Nodemailer | 7.0.13 | Email notifications | Industry standard, actively maintained, supports all major providers |
| Web Push Library | 3.6.5 | Web push notifications | Browser-native push notifications with VAPID support |
| Expo Notifications | 52.0.0+ | Mobile push notifications | For React Native mobile app push notifications |

### Analytics & Reporting
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | 3.7.0 | React charting library | Native React components with D3, TypeScript-first, excellent Next.js SSR support |
| Chart.js | 4.5.1 | Advanced charting fallback | More customization options, 67k+ stars, industry standard |

### Leave Balance Tracking
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| date-fns | 4.1+ | Date manipulation | Lightweight, tree-shakable, superior performance over Moment.js |
| Prisma Custom Models | - | Balance calculation logic | Leverages existing Prisma setup for type-safe balance tracking |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/nodemailer | 6.4+ | TypeScript types for Nodemailer | When using Nodemailer with TypeScript |
| next-auth | 5.0+ | Authentication enhancement | If upgrading auth system for new integrations |
| node-cron | 3.1+ | Scheduled balance calculations | For automated daily/monthly balance updates |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|-----------|
| Calendar API | Google APIs | Microsoft Graph API | Google has broader enterprise adoption and simpler OAuth flow |
| Push Notifications | Web Push Library | Firebase Cloud Messaging | Web Push is browser-native, no vendor lock-in, free |
| Charts | Recharts | D3.js directly | Recharts provides React components, less boilerplate |
| Email | Nodemailer | SendGrid | Nodemailer is free, more control, simpler SMTP setup |
| Date Library | date-fns | Moment.js | date-fns is tree-shakable, smaller bundle, modern API |

## Installation

```bash
# Core enhancements
npm install next@16 react@19 react-dom@19 typescript@5.7
npm install prisma@6 @prisma/client

# Calendar integration
npm install googleapis@140
# OR for Microsoft ecosystem
npm install @microsoft/microsoft-graph-client

# Notifications
npm install nodemailer@7.0.13 web-push@3.6.5
# OR for mobile app support
npm install expo@52

# Analytics & reporting
npm install recharts@3.7.0 chart.js@4.5.1

# Balance tracking utilities
npm install date-fns@4.1

# Development tools
npm install -D @types/nodemailer@6.4
npm install -D node-cron@3.1
```

## Stack Patterns by Variant

**If using Google Calendar:**
- Use googleapis@140 with OAuth 2.0 flow
- Because it's the officially supported Google client library
- Store refresh tokens securely for recurring API calls

**If using Microsoft Ecosystem:**
- Use @microsoft/microsoft-graph-client
- Because it provides unified access to Office 365 services
- Requires Azure AD app registration

**If web-only push notifications:**
- Use web-push library with VAPID keys
- Because it's the W3C standard approach
- No vendor dependencies, works across all modern browsers

**If mobile app required:**
- Use Expo push notifications
- Because it provides unified push service across iOS/Android
- Handles platform-specific delivery optimizations

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@16.2 | react@19, typescript@5.7+ | Requires React 19 for new features |
| recharts@3.7 | next@16.2, react@19 | Full SSR support with Next.js 16.2 |
| googleapis@140 | node@18+ | Requires Node.js 18 LTS or later |
| nodemailer@7.0 | node@18+ | Optimized for async/await patterns |
| web-push@3.6.5 | node@18+ | Requires VAPID key generation utilities |

## Sources

- Google APIs Node.js Client — https://github.com/googleapis/google-api-nodejs-client — Official Google client library
- Nodemailer — https://github.com/nodemailer/nodemailer — Industry standard for Node.js email
- Web Push Library — https://github.com/web-push-libs/web-push — W3C Web Push Protocol implementation
- Recharts — https://github.com/recharts/recharts — React-native charting library
- Chart.js — https://github.com/chartjs/Chart.js — Fallback charting option with extensive customization
- Next.js — https://github.com/vercel/next.js — Latest canary releases and features
- date-fns — https://github.com/date-fns/date-fns — Modern date utility library