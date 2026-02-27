import { revalidatePath } from "next/cache"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/rbac"
import { saveWorkflow } from "@/app/actions/workflow/save-workflow"

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}))

jest.mock("@/lib/rbac", () => ({
    getCurrentUser: jest.fn(),
}))

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {
        workflow: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        audit: {
            create: jest.fn(),
        },
    },
}))

const prismaMock = prisma as unknown as {
    workflow: {
        findFirst: jest.Mock
        create: jest.Mock
        update: jest.Mock
    }
    audit: {
        create: jest.Mock
    }
}

const getCurrentUserMock = getCurrentUser as jest.Mock
const revalidatePathMock = revalidatePath as jest.Mock

describe("saveWorkflow audit coverage", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const payload = {
        id: "wf-1",
        name: "Workflow A",
        isActive: true,
        requestTypes: ["LEAVE_REQUEST"],
        contractTypes: ["any"],
        subjectRoles: ["any"],
        departments: ["any"],
        projectTypes: ["any"],
        steps: [
            {
                resolver: "ROLE" as const,
                resolverId: "role-1",
                scope: ["GLOBAL" as const],
                autoApprove: false,
            },
        ],
        watchers: [],
    }

    it("writes create audit event for new workflow", async () => {
        getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
        prismaMock.workflow.findFirst.mockResolvedValue(null)
        prismaMock.workflow.create.mockResolvedValue({ id: "wf-1" })

        const result = await saveWorkflow(payload as any)

        expect(result.success).toBe(true)
        expect(prismaMock.audit.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                entityType: "workflow",
                entityId: "wf-1",
                attribute: "workflow.policy.create",
                companyId: "company-1",
                byUserId: "user-1",
            }),
        })
        expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows")
    })

    it("writes update audit event for existing workflow", async () => {
        getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
        prismaMock.workflow.findFirst.mockResolvedValue({ id: "wf-1" })
        prismaMock.workflow.update.mockResolvedValue({ id: "wf-1" })

        const result = await saveWorkflow(payload as any)

        expect(result.success).toBe(true)
        expect(prismaMock.audit.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                entityType: "workflow",
                entityId: "wf-1",
                attribute: "workflow.policy.update",
                companyId: "company-1",
                byUserId: "user-1",
            }),
        })
        expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows/wf-1")
    })
})
