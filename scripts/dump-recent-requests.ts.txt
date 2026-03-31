import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("=== RECENT LEAVE REQUESTS ===");
    const requests = await prisma.leaveRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
            user: true,
            approvalSteps: {
                include: { approver: true, role: true }
            },
            leaveType: true
        }
    });

    requests.forEach(r => {
        console.log(`\nRequest ID: ${r.id} | User: ${r.user.name} | CreatedAt: ${r.createdAt}`);
        console.log(`Status: ${r.status}`);
        // Check if there's a projectId on the request?
        // Wait, does LeaveRequest have a projectId? 
        // Let's check the schema.
        console.log(`Steps:`);
        r.approvalSteps.forEach(s => {
            console.log(`  - Step ${s.sequenceOrder}: ${s.approver.name} ${s.approver.lastname} (Role: ${s.role?.name || 'N/A'})`);
        });
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
