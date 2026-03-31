// Simulation of the current notification logic
const allSteps = [
    { id: 'p1-s1', policyId: 'P1', sequenceOrder: 1, approverId: 'USR-A', status: 1 }, // Just approved
    { id: 'p1-s2', policyId: 'P1', sequenceOrder: 2, approverId: 'USR-B', status: 0 }, // Next for P1
    { id: 'p2-s1', policyId: 'P2', sequenceOrder: 1, approverId: 'USR-C', status: 0 }  // Stuck at S1 for P2
];

// The step that was just acted upon
const actedUponSteps = [{ id: 'p1-s1', policyId: 'P1' }];

function getNextApproverIds(steps: any[]) {
    // Current Logic
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

function getNextApproverIdsFixed(steps: any[], actedIds: any[]) {
    // Fixed Logic: Only consider policies that were acted upon
    const affectedPolicyIds = new Set(actedIds.map(s => s.policyId));

    // We only want notifications for the NEXT step of the policies that just changed.
    // However, we still need to calculate "next" correctly.

    const pendingNext = steps.filter(s => s.status === 0);
    const nextApproverIds: string[] = [];
    const nextGroups = pendingNext.reduce((acc, step) => {
        const pid = step.policyId || 'UNCATEGORIZED';
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(step);
        return acc;
    }, {} as Record<string, any[]>);

    for (const pid in nextGroups) {
        // FILTER: Only process this group if it matches an affected policy
        if (!affectedPolicyIds.has(pid)) continue;

        const groupSteps = nextGroups[pid];
        const minSeq = Math.min(...groupSteps.map(s => s.sequenceOrder ?? 999));
        const inPolicy = groupSteps.filter(s => (s.sequenceOrder ?? 999) === minSeq).map(s => s.approverId);
        nextApproverIds.push(...inPolicy);
    }
    return Array.from(new Set(nextApproverIds));
}

console.log("Current Logic Result (Should include USR-B and USR-C):");
const currentResult = getNextApproverIds(allSteps);
console.log(currentResult);

console.log("\nFixed Logic Result (Should ONLY include USR-B):");
const fixedResult = getNextApproverIdsFixed(allSteps, actedUponSteps);
console.log(fixedResult);
