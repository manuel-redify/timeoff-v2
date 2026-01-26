# Database Connection Issue Fix Runbook

**Issue:** Prisma client cannot connect to database, causing authentication failures and UI crashes
**Symptoms:** 401 unauthorized errors, "notifications is not iterable" errors, database query failures

## Root Cause Analysis

1. **Prisma Client Initialization Failure:** Custom PostgreSQL adapter not working properly
2. **Environment Variable Loading:** `DATABASE_URL` not being loaded correctly in terminal
3. **Database Sync Issues:** Database reset may have corrupted schema/client sync

## Step-by-Step Fix Procedure

### Phase 1: Diagnostics

#### Step 1.1: Verify Environment Variables
```bash
# Check if DATABASE_URL is accessible
echo "DATABASE_URL in .env.local: $(grep DATABASE_URL .env.local)"

# Test environment variable loading in context
npm run dev -- --help | head -5
```

#### Step 1.2: Test Direct Database Connection
```bash
# Test with psql (if available)
psql "$(grep DATABASE_URL .env.local | cut -d'=' -f2)" -c "SELECT 1;"

# Or test with node
node -e "
require('dotenv').config({ path: '.env.local' });
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
"
```

#### Step 1.3: Check Prisma Configuration
```bash
# Verify Prisma config exists and is valid
npx prisma --version
npx prisma validate
npx prisma db pull --preview-feature
```

### Phase 2: Basic Fixes

#### Step 2.1: Clean Prisma Generated Client
```bash
# Remove generated client completely
rm -rf lib/generated
rm -rf node_modules/.prisma/client

# Regenerate fresh
npx prisma generate
```

#### Step 2.2: Test Without Custom Adapter
```bash
# Create backup of original prisma.ts
cp lib/prisma.ts lib/prisma.ts.backup

# Create minimal test version
cat > lib/prisma.minimal.ts << 'EOF'
import { PrismaClient } from './generated/prisma/client';

const prismaClientSingleton = () => {
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}

export default prisma;
EOF

# Test with minimal version
cp lib/prisma.minimal.ts lib/prisma.ts
```

#### Step 2.3: Test Minimal Connection
```bash
# Create test script
cat > test-minimal.ts << 'EOF'
import prisma from './lib/prisma';

async function test() {
    try {
        console.log('Testing minimal Prisma connection...');
        const count = await prisma.user.count();
        console.log('✅ Connection successful! User count:', count);
    } catch (error: any) {
        console.error('❌ Connection failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
EOF

# Run test
npx tsx test-minimal.ts
```

### Phase 3: Alternative Solutions

#### Step 3.1: Fix Custom Adapter (If Minimal Works)
```bash
# If minimal test works, try fixing the adapter
cat > lib/prisma.fixed.ts << 'EOF'
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

const prismaClientSingleton = () => {
    try {
        // Test basic connection string format
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL is not defined');
        }
        
        console.log('Attempting connection with:', connectionString.substring(0, 50) + '...');
        
        const pool = new Pool({ 
            connectionString,
            max: 1, // Limit connections
            idleTimeoutMillis: 30000
        });
        const adapter = new PrismaPg(pool);
        
        return new PrismaClient({ 
            adapter,
            log: ['query', 'error', 'warn'] // Enable logging
        });
    } catch (error) {
        console.error('Prisma client initialization failed:', error);
        throw error;
    }
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}

export default prisma;
EOF

# Test fixed version
cp lib/prisma.fixed.ts lib/prisma.ts
npx tsx test-minimal.ts
```

#### Step 3.2: Try Direct PostgreSQL Connection
```bash
# If adapter still fails, try direct approach
cat > lib/prisma.direct.ts << 'EOF'
import { PrismaClient } from './generated/prisma/client';

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL;
    
    return new PrismaClient({
        datasources: {
            db: {
                url: connectionString
            }
        },
        log: ['error', 'warn']
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}

export default prisma;
EOF

# Test direct connection
cp lib/prisma.direct.ts lib/prisma.ts
npx tsx test-minimal.ts
```

### Phase 4: Database Reset and Re-initialization

#### Step 4.1: Complete Database Reset
```bash
# Full database reset
npx prisma db push --force-reset

# Wait for reset to complete, then regenerate
npx prisma generate

# Re-seed database
npx prisma db seed
```

#### Step 4.2: Verify Database State
```bash
# Test with current configuration
npx tsx test-minimal.ts

# Check if tables exist
npx tsx -e "
import prisma from './lib/prisma';
prisma.user.count().then(c => console.log('Users:', c)).catch(e => console.error('Error:', e.message)).finally(() => prisma.\$disconnect());
"
```

### Phase 5: Environment and Server Configuration

#### Step 5.1: Environment Loading Fix
```bash
# Check next.config.js for env loading
cat next.config.js | grep -i env

# Ensure .env.local is properly loaded
npm list dotenv

# If needed, install dotenv if missing
npm install dotenv --save-dev
```

#### Step 5.2: Server Restart Protocol
```bash
# Stop any running processes
taskkill /f /im node.exe 2>nul || true

# Clear any caches
rm -rf .next
rm -rf node_modules/.cache

# Restart development server
npm run dev
```

### Phase 6: Fallback Solutions

#### Step 6.1: Alternative Database Connection Methods
```bash
# Try using connection string without custom adapter
# Option A: Use DATABASE_URL directly in env
echo "DATABASE_URL=$(grep DATABASE_URL .env.local)" > .env.local

# Option B: Try without connection pooling parameters
cat > lib/prisma.nopool.ts << 'EOF'
import { PrismaClient } from './generated/prisma/client';

// Remove connection pooling parameters from URL
const dbUrl = process.env.DATABASE_URL?.replace(/&?[^&]*pooling[^&]*/g, '');

const prismaClientSingleton = () => {
    return new PrismaClient({
        datasources: {
            db: {
                url: dbUrl
            }
        }
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;
EOF
```

#### Step 6.2: Verify Neon Database Connection
```bash
# Test Neon database directly via API
curl -X POST "https://ep-old-butterfly-agxu2eg6-pooler.c-2.eu-central-1.aws.neon.tech/v1/query" \
  -H "Authorization: Bearer $(grep DATABASE_URL .env.local | cut -d':' -f3 | cut -d'@' -f1)" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT 1"}'
```

### Phase 7: Recovery

#### Step 7.1: Restore Working Configuration
```bash
# If any backup exists, restore it
if [ -f lib/prisma.ts.backup ]; then
    cp lib/prisma.ts.backup lib/prisma.ts
    echo "Restored backup configuration"
fi

# Or use the most successful test configuration
# cp lib/prisma.direct.ts lib/prisma.ts
```

#### Step 7.2: Final Verification
```bash
# Clean up test files
rm -f test-minimal.ts lib/prisma.*.ts lib/prisma.ts.backup

# Final connection test
npx tsx -e "
import prisma from './lib/prisma';
(async () => {
  try {
    const count = await prisma.user.count();
    console.log('✅ Database connection fixed! Users:', count);
  } catch (error: any) {
    console.error('❌ Still failing:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
"
```

## Troubleshooting Matrix

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| "PrismaClientInitializationError" | No DATABASE_URL | Check .env.local |
| "Invalid $queryRaw() invocation" | Adapter failure | Try direct connection |
| "Connection timeout" | Network issues | Check Neon status |
| "Authentication failed" | Invalid credentials | Verify DATABASE_URL format |

## Success Criteria

- [ ] `npx tsx test-minimal.ts` runs without errors
- [ ] User count returns > 0 (after seeding)
- [ ] Development server starts without database errors
- [ ] Notifications API returns 200 status
- [ ] User authentication works (401 errors resolved)

## Post-Fix Checklist

- [ ] Clean up any test files and temporary configurations
- [ ] Restart development server to ensure clean state
- [ ] Test API endpoints that depend on database
- [ ] Verify user login flow works
- [ ] Check notification functionality
- [ ] Document the working configuration for future reference

## If All Else Fails

1. **Contact Neon support** - database might have issues
2. **Try new database** - create new Neon instance
3. **Consider migration** - export data and import to new database
4. **Fallback to SQLite** for local development only

## Important Notes

- Always backup `lib/prisma.ts` before making changes
- Test each solution independently
- Don't skip environment variable verification
- Some fixes may require complete server restart
- Check Neon dashboard for any database status issues