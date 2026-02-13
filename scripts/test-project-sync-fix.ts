import prisma from "../lib/prisma";
import { getUserProjectService } from "../lib/services/user-project-service";

async function testProjectSyncFix() {
    console.log("Starting weight verification test for Project Sync Fix...");

    // 1. Get a test user and a test project
    const user = await prisma.user.findFirst();
    const project = await prisma.project.findFirst({ where: { status: 'ACTIVE', archived: false } });
    const role = await prisma.role.findFirst();

    if (!user || !project) {
        console.error("Test data missing: user or project not found.");
        return;
    }

    console.log(`Using User: ${user.email}, Project: ${project.name}`);

    const userProjectService = getUserProjectService(prisma);

    try {
        // 2. Mock incoming assignments with placeholder values
        const assignments = [
            {
                projectId: project.id,
                roleId: "default", // Should be cleaned to null
                allocation: 50,
                startDate: new Date().toISOString().split('T')[0],
                endDate: null
            },
            {
                projectId: "none", // Should be filtered out
                roleId: null,
                allocation: 50,
                startDate: new Date().toISOString().split('T')[0],
                endDate: null
            }
        ];

        console.log("Syncing assignments with placeholder values...");
        const result = await userProjectService.syncUserProjects(user.id, assignments as any);

        console.log("Sync result:", result);

        // 3. Verify the result
        const saved = await userProjectService.getUserProjects(user.id);
        const filtered = saved.find(p => p.projectId === project.id);

        if (filtered && filtered.roleId === null) {
            console.log("✅ Success: 'default' roleId was correctly cleaned to null.");
        } else {
            console.error("❌ Failure: 'default' roleId was NOT cleaned to null or assignment missing.");
        }

        const noneExists = saved.some(p => p.projectId === "none");
        if (!noneExists) {
            console.log("✅ Success: 'none' projectId was correctly filtered out.");
        } else {
            console.error("❌ Failure: 'none' projectId was NOT filtered out.");
        }

        // Cleanup: remove the test assignment
        await userProjectService.syncUserProjects(user.id, []);
        console.log("Cleanup complete.");

    } catch (error) {
        console.error("Test failed with error:", error);
    }
}

testProjectSyncFix()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
