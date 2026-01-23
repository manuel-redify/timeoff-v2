import "dotenv/config";
import prisma from '../lib/prisma';
import { ApprovalService } from '../lib/services/approval.service';

async function main() {
    console.log('--- Verification: Supervisor Dashboard View ---');

    // Manuel Magnani's ID (Supervisor)
    const supervisorId = '42de83f9-e13f-4d03-8208-5a816e7c7629';
    const companyId = '33b46df1-2b04-4fbd-956a-ffb63da3fe88';

    try {
        const pending = await ApprovalService.getPendingApprovals(supervisorId, companyId);
        console.log('Total Pending Requests:', pending.length);

        pending.forEach(p => {
            console.log(`- Request ${p.id} from ${p.user.name} ${p.user.lastname} (Status: 0)`);
        });

        const tonyRequest = pending.find(p => p.user.lastname === 'Stark');
        if (tonyRequest) {
            console.log('✅ SUCCESS: Tony Stark\'s request is visible to the supervisor.');
        } else {
            console.log('❌ FAILURE: Tony Stark\'s request is still NOT visible.');
        }

    } catch (e) {
        console.error('Error during verification:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
