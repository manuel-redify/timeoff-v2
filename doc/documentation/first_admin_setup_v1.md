# First Admin Setup
**Version:** v1 | **Date:** 2026-02-02
**Related Skills:** N/A | **Dependencies:** 01_architecture_v[N].md (for environment setup)

## Overview
Configure the initial administrator user for your TimeOff application instance through environment variables. This allows customization of the first admin account created during database seeding.

## Configuration

### Environment Variables

Set these optional variables in your `.env` file to customize the first admin user:

| Variable | Default Value | Description |
|----------|--------------|-------------|
| `ADMIN_NAME` | `Admin` | First name of the administrator |
| `ADMIN_LASTNAME` | `User` | Last name of the administrator |
| `ADMIN_EMAIL` | `admin@example.com` | Email address for the administrator account |
| `DEV_DEFAULT_PASSWORD` | `Welcome2024!` | Password for the administrator account |

### Example Configuration

```env
# First Admin User Configuration
ADMIN_NAME="John"
ADMIN_LASTNAME="Doe"
ADMIN_EMAIL="john.doe@company.com"
DEV_DEFAULT_PASSWORD="SecurePassword123!"
```

## Implementation Details

### Seeding Process

The admin user is created during the database seeding process (`npx prisma db seed`).

**Location:** `scripts/seed.ts`

**Logic:**
1. Reads environment variables with fallback defaults
2. Checks if a user with the specified email already exists
3. If not found, creates the admin user with:
   - `isAdmin: true`
   - `activated: true`
   - Assigned to the "Admin" role
   - Assigned to the "General" department

### Password Security

Passwords are hashed using bcrypt with a salt round of 12 before storage in the database.

## Usage

### Setting Up First Admin

1. **Configure environment variables** in `.env` or `.env.local`:
   ```env
   ADMIN_NAME="Your"
   ADMIN_LASTNAME="Name"
   ADMIN_EMAIL="your.email@company.com"
   DEV_DEFAULT_PASSWORD="YourSecurePassword"
   ```

2. **Run database seeding**:
   ```bash
   npm run db:seed
   # or
   npx prisma db seed
   ```

3. **Login** with the configured email and password

### Changing Admin After Creation

Once the admin user is created, modifying environment variables will NOT update the existing user. To change the admin:

1. Use the application's user management interface, or
2. Manually update the user record in the database

## Security Considerations

- **Change default password immediately** after first login
- **Use strong, unique passwords** in production environments
- **Do not commit `.env` files** with real credentials to version control
- **Consider using OAuth** for production authentication (see `05_google_oauth_setup.md`)

## Troubleshooting

### Admin Not Created

- Check that seeding ran successfully: `npm run db:seed`
- Verify environment variables are loaded: restart your development server
- Check database connection: ensure `DATABASE_URL` is correctly configured

### Duplicate Admin Users

The seeding process prevents duplicate creation by checking the email address. If you need multiple admins, create additional users through the application interface after initial setup.

## Change Log

**v1:** Initial documentation for environment-based first admin configuration
