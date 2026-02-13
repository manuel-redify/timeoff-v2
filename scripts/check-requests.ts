import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("=== Peter Parker Leave Request History ===");
    const requests = await prisma.leaveRequest.findMany({
        where: { user: { name: 'Peter' } },
        include: {
            approvalSteps: {
                include: { approver: true, role: true }
            },
            leaveType: true
        }
    });

    if (requests.length === 0) {
        console.log("No leave requests found for Peter Parker.");
    } else {
        requests.forEach(r => {
            console.log(`\nRequest ID: ${r.id}`);
            console.log(`Status: ${r.status}`);
            console.log(`Type: ${r.leaveType.name}`);
            console.log(`Steps:`);
            r.approvalSteps.forEach(s => {
                console.log(`- Approver: ${s.approver.name} ${s.approver.lastname} (Role: ${s.role?.name || 'N/A'}) Status: ${s.status} Order: ${s.sequenceOrder}`);
            });
        });
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
