# TimeOff Management System

A comprehensive leave management system built with Next.js 16, TypeScript, Prisma, and PostgreSQL. Features role-based access control, multi-tenant support, and Google OAuth integration.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Cloud Console account (for OAuth setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd timeoff-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Configure your environment (see Environment Setup section below).

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed  # Optional: Create initial data
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## ⚙️ Environment Setup

### Required Environment Variables

Create a `.env` file with the following variables:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Auth.js Configuration
AUTH_SECRET="your-generated-secret-here"

# Google OAuth Configuration (Required for production)
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"

# Email Service (SMTP2GO)
SMTP2GO_API_KEY="your-smtp2go-api-key"

# Application Configuration
SERVEO_SUBDOMAIN="your-subdomain"  # For webhooks tunneling
DEV_DEFAULT_PASSWORD="Welcome2024!"  # Default password for dev users
ENABLE_OAUTH_IN_DEV="false"  # Set to "true" to enable OAuth in dev
```

### Auth.js Secret Generation

Generate a secure `AUTH_SECRET`:

```bash
npx auth secret
# or
openssl rand -base64 32
```

## 🔐 Authentication Setup

### Development Authentication

In development mode, the application supports **credentials-based authentication**:

- **Email**: Any existing user email
- **Default Password**: `Welcome2024!` (configurable via `DEV_DEFAULT_PASSWORD`)
- **Dev users** are created via database seeding

### Production Authentication (Google OAuth)

#### 1. Google Cloud Console Setup

1. **Create/Select Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Configure OAuth Consent Screen**
   - Navigate to `APIs & Services > OAuth consent screen`
   - Fill in:
     - **App name**: "TimeOff Management"
     - **User support email**: Your support email
     - **Developer contact information**: Your email

3. **Create OAuth 2.0 Credentials**
   - Go to `APIs & Services > Credentials`
   - Click `+ CREATE CREDENTIALS > OAuth 2.0 Client IDs`
   - Select **Web application**
   - Configure:
     - **Name**: "TimeOff Web App"
     - **Authorized JavaScript origins**: `https://yourdomain.com`
     - **Authorized redirect URIs**: 
       ```
       https://yourdomain.com/api/auth/callback/google
       https://yourdomain.com/login
       ```
   - Save and note your **Client ID** and **Client Secret**

#### 2. Environment Configuration

Add your Google OAuth credentials to `.env`:

```env
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-client-secret"
```

#### 3. Production Deployment

In production:
- Set `ENABLE_OAUTH_IN_DEV="true"` to enable Google OAuth
- Set `NODE_ENV="production"`
- Update authorized origins and redirect URIs to match your production domain

## 📊 Database Schema

The application uses Prisma with PostgreSQL. Key tables include:

- **Users**: Authentication and profile management
- **Companies**: Multi-tenant support
- **Sessions**: Auth.js database-backed sessions (30-day expiration)
- **LeaveRequests**: Core leave management
- **ApprovalWorkflows**: Multi-level approval chains
- **Departments**: Organizational structure
- **Audit**: Comprehensive change tracking

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/         # Protected application pages
│   └── api/               # API routes
├── components/              # Reusable UI components
│   └── ui/               # Base UI components
├── lib/                    # Utilities and configurations
│   ├── actions/           # Server actions
│   ├── services/           # Business logic
│   └── rbac.ts           # Role-based access control
├── prisma/                 # Database schema and migrations
└── doc/                    # Documentation
```

## 🔒 Authentication Flow

### Session Management

- **Strategy**: Database-backed sessions via Auth.js
- **Duration**: 30 days (configurable in `auth.ts`)
- **Storage**: Secure HTTP-only cookies
- **Security**: Automatic session invalidation on logout

### User Roles

- **Admin**: Full system access, user management
- **Supervisor**: Department-level approvals
- **User**: Basic leave request access

### Access Control

All API routes and protected pages implement:

```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Role-based checks
const user = await getCurrentUser();
if (!user?.isAdmin) {
  redirect("/");
}
```

## 🛠️ Development Workflow

### 1. Local Development

```bash
npm run dev
```

Features include:
- **Hot reload**: Changes automatically reflected
- **Error overlay**: Detailed debugging information
- **Turbopack**: Fast development builds

### 2. Database Management

```bash
# View and edit data
npx prisma studio

# Generate migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

### 3. Testing

```bash
# Run tests
npm test  # If configured

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV="production"
DATABASE_URL="your-production-database-url"
AUTH_SECRET="your-production-secret"
AUTH_GOOGLE_ID="your-production-oauth-id"
AUTH_GOOGLE_SECRET="your-production-oauth-secret"
SMTP2GO_API_KEY="your-production-smtp-key"
```

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Connect your GitHub repository to Vercel
   - Configure build command: `npm run build`

2. **Environment Variables**
   - Set all required environment variables in Vercel dashboard
   - Ensure `AUTH_SECRET` is generated securely

3. **Domain Configuration**
   - Update Google OAuth redirect URIs to include your Vercel domain
   - Configure custom domain if needed

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📧 Available Scripts

```json
{
  "dev": "next dev",                    # Development server
  "build": "next build",               # Production build
  "start": "next start",               # Production server
  "lint": "eslint",                  # Code linting
  "db:generate": "prisma generate",   # Generate Prisma client
  "db:push": "prisma db push",       # Push schema changes
  "db:studio": "prisma studio",       # Database GUI
  "db:seed": "prisma db seed",        # Seed database
  "tunnel": "npm run serveo"         # Development tunneling
}
```

## 🔧 User Management

### Invite-Only System

This system uses an **admin-invite model**:

1. **Admin users** can create new user accounts via `/admin/users`
2. **Users** are created with temporary passwords
3. **First login** prompts users to change passwords
4. **Google OAuth** can be linked after initial setup

### Access Revocation

Administrators can immediately revoke access:

- **Session Deletion**: Via `npx prisma studio` → Sessions table
- **Account Deactivation**: Set `active: false` in Users table
- **Contract Expiration**: Automatic blocking of expired contracts

## 🛡️ Security Features

- **Multi-tenant isolation**: Users only access their company data
- **Role-based permissions**: Admin/Supervisor/User access levels
- **Session management**: Secure database-backed authentication
- **Audit logging**: All changes tracked with user attribution
- **Input validation**: Comprehensive request validation using Zod
- **CSRF protection**: Built-in with Next.js/Auth.js

## 📚 API Documentation

### Authentication Headers

All protected API routes require:
- **Authorization**: Not required (uses cookie-based sessions)
- **Content-Type**: `application/json` for POST/PUT requests

### Error Handling

Standardized error responses:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Common Endpoints

- `GET /api/users/me` - Current user information
- `POST /api/leave-requests` - Create new leave request
- `POST /api/approvals/bulk-action` - Bulk approval/rejection
- `GET /api/approvals` - Get pending approvals

## 🧭 Troubleshooting

### Common Issues

**"User not found" after login**:
- Check if user exists in `users` table
- Verify database connection string
- Check webhook user creation for OAuth

**"Access denied" for admin routes**:
- Verify `isAdmin: true` in database
- Check session is valid
- Clear browser cookies and re-login

**Database connection errors**:
- Verify `DATABASE_URL` format
- Check network connectivity
- Ensure Prisma client is generated

### Development Tips

- Use `npx prisma studio` to debug data issues
- Check browser console for JavaScript errors
- Review Next.js development server logs
- Use environment variables for sensitive data

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in `/doc` directory
- Review the PRD analysis for architectural decisions