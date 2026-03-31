import prisma from '../lib/prisma';

async function migrateUserAreas() {
  console.log('=== Starting User Area Migration ===\n');

  try {
    // Step 1: Get all user_role_area records with non-null areaId
    const userRoleAreas = await prisma.$queryRaw`
      SELECT DISTINCT ON (user_id) user_id, area_id
      FROM user_role_area
      WHERE area_id IS NOT NULL
      ORDER BY user_id, created_at DESC
    `;

    console.log(`Found ${(userRoleAreas as any[]).length} users with areas to migrate\n`);

    // Step 2: Update each user's area_id
    let updatedCount = 0;
    for (const record of userRoleAreas as any[]) {
      await prisma.$executeRaw`
        UPDATE users
        SET area_id = ${record.area_id}
        WHERE id = ${record.user_id}
      `;
      updatedCount++;
      console.log(`Updated user ${record.user_id} with area ${record.area_id}`);
    }

    console.log(`\n=== Updated ${updatedCount} users ===\n`);

    // Step 3: Verify the migration
    const usersWithAreas = await prisma.$queryRaw`
      SELECT u.id, u.name, u.lastname, a.name as area_name
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      WHERE u.area_id IS NOT NULL
    `;

    console.log('Users with areas after migration:');
    for (const user of usersWithAreas as any[]) {
      console.log(`  - ${user.name} ${user.lastname}: ${user.area_name}`);
    }

    console.log('\n=== Migration Complete ===');
    console.log('Next step: Run npx prisma db push --accept-data-loss to drop user_role_area table');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateUserAreas();
