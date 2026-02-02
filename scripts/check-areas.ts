import prisma from '../lib/prisma';

async function checkAreas() {
    try {
        console.log('=== Checking Area User Counts ===\n');
        
        // Get all areas
        const areas = await prisma.area.findMany();
        console.log(`Found ${areas.length} areas:`);
        for (const area of areas) {
            console.log(`  - ${area.name} (ID: ${area.id})`);
        }
        
        console.log('\n=== Users with area_id set ===\n');
        const usersWithArea = await prisma.user.findMany({
            where: { areaId: { not: null } },
            include: { area: true }
        });
        
        console.log(`Found ${usersWithArea.length} users with area:`);
        for (const user of usersWithArea) {
            console.log(`  - ${user.name} ${user.lastname}: ${user.area?.name} (areaId: ${user.areaId})`);
        }
        
        console.log('\n=== Area to Users Mapping ===\n');
        for (const area of areas) {
            const usersInArea = await prisma.user.findMany({
                where: { areaId: area.id, deletedAt: null }
            });
            console.log(`${area.name}: ${usersInArea.length} users`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAreas();
