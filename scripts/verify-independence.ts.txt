// Simulate the independent progression logic
const pendingSteps = [
    { id: 'p1-s1', policyId: 'P1', sequenceOrder: 1, approverId: 'USR-A' },
    { id: 'p1-s2', policyId: 'P1', sequenceOrder: 2, approverId: 'USR-B' },
    { id: 'p2-s1', policyId: 'P2', sequenceOrder: 1, approverId: 'USR-C' }
];

function getActionableSteps(user: { id: string, isAdmin: boolean }, steps: any[]) {
    const policyActionableIds: string[] = [];
    const policyGroups = steps.reduce((acc, step) => {
        const pid = step.policyId || 'UNCATEGORIZED';
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(step);
        return acc;
    }, {} as Record<string, any[]>);

    for (const pid in policyGroups) {
        const groupSteps = policyGroups[pid];
        const minSeq = Math.min(...groupSteps.map(s => s.sequenceOrder ?? 999));
        const actionable = groupSteps.filter(s => (s.sequenceOrder ?? 999) === minSeq && s.approverId === user.id);
        policyActionableIds.push(...actionable.map(s => s.id));
    }
    return policyActionableIds;
}

function getNextApproverIds(steps: any[]) {
    const pendingNext = steps.filter(s => s.status === 0);
    const nextApproverIds: string[] = [];
    const nextGroups = pendingNext.reduce((acc, step) => {
        const pid = step.policyId || 'UNCATEGORIZED';
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(step);
        return acc;
    }, {} as Record<string, any[]>);

    for (const pid in nextGroups) {
        const groupSteps = nextGroups[pid];
        const minSeq = Math.min(...groupSteps.map(s => s.sequenceOrder ?? 999));
        const inPolicy = groupSteps.filter(s => (s.sequenceOrder ?? 999) === minSeq).map(s => s.approverId);
        nextApproverIds.push(...inPolicy);
    }
    return Array.from(new Set(nextApproverIds));
}

console.log("Scenario 1: User A is approving Step 1 of Project 1.");
console.log("Steps pending:", pendingSteps.map(s => `${s.id} (Seq ${s.sequenceOrder})`).join(", "));
const actionableA = getActionableSteps({ id: 'USR-A', isAdmin: false }, pendingSteps);
console.log("Actionable for A:", actionableA);

console.log("\nScenario 2: P1-S1 is approved. Now calculating next notifications.");
const pendingStepsNext = [
    { id: 'p1-s2', policyId: 'P1', sequenceOrder: 2, approverId: 'USR-B', status: 0 },
    { id: 'p2-s1', policyId: 'P2', sequenceOrder: 1, approverId: 'USR-C', status: 0 }
];
const nextNotifs = getNextApproverIds(pendingStepsNext);
console.log("Next Approver IDs to notify:", nextNotifs);
if (nextNotifs.includes('USR-B')) console.log("✅ User B (P1-S2) will be notified even though P2 is at S1.");
else console.log("❌ User B is skipped for notification (Failure)");
if (nextNotifs.includes('USR-C')) console.log("✅ User C (P2-S1) will also be notified.");
