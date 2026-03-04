
import { LeaveRequestService } from '../lib/services/leave-request.service';
import prisma from '../lib/prisma';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: 'Peter' }
    });

    if (!user) {
        console.log("No user found");
        return;
    }

    const ytd = await LeaveRequestService.getLeavesTakenYTD(user.id);
    console.log({ peterLeavesTakenYTD: ytd });
    process.exit(0);
}

main().catch(console.error);
