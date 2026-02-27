import { readFileSync } from "fs"
import path from "path"
import { revalidatePath } from "next/cache"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/rbac"
import { deleteWorkflow } from "@/app/actions/workflow/delete-workflow"
import { duplicateWorkflow } from "@/app/actions/workflow/duplicate-workflow"
import { getWorkflow } from "@/app/actions/workflow/get-workflow"

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
            delete: jest.fn(),
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
        delete: jest.Mock
    }
    audit: {
        create: jest.Mock
    }
}

const getCurrentUserMock = getCurrentUser as jest.Mock
const revalidatePathMock = revalidatePath as jest.Mock

describe("workflow policy management actions", () => {
    let randomUuidSpy: jest.SpyInstance<string, []>

    beforeEach(() => {
        jest.clearAllMocks()
        randomUuidSpy = jest.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("wf-copy-1")
    })

    afterEach(() => {
        randomUuidSpy.mockRestore()
    })

    describe("duplicateWorkflow", () => {
        it("returns unauthorized when user is missing", async () => {
            getCurrentUserMock.mockResolvedValue(null)

            const result = await duplicateWorkflow("wf-1")

            expect(result).toEqual({ success: false, error: "Unauthorized" })
            expect(prismaMock.workflow.findFirst).not.toHaveBeenCalled()
        })

        it("duplicates workflow payload with new id and copy suffix", async () => {
            getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
            prismaMock.workflow.findFirst.mockResolvedValue({
                rules: {
                    id: "wf-1",
                    name: "Team Approval",
                    steps: [{ id: "s1", resolver: "ROLE" }],
                    watchers: [{ id: "w1" }],
                },
            })
            prismaMock.workflow.create.mockResolvedValue({ id: "workflow-2" })

            const result = await duplicateWorkflow("wf-1")

            expect(result).toEqual({ success: true, data: { id: "wf-copy-1" } })
            expect(prismaMock.workflow.create).toHaveBeenCalledTimes(1)

            const createArgs = prismaMock.workflow.create.mock.calls[0][0]
            expect(createArgs.data.id).toBe("wf-copy-1")
            expect(createArgs.data.name).toBe("Team Approval (Copy)")
            expect(createArgs.data.rules).toEqual(expect.objectContaining({
                steps: [{ id: "s1", resolver: "ROLE" }],
                watchers: [{ id: "w1" }],
            }))

            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows")
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows/wf-1")
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows/wf-copy-1")
            expect(prismaMock.audit.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    entityType: "workflow",
                    entityId: "wf-copy-1",
                    attribute: "workflow.policy.duplicate",
                }),
            })
        })

        it("fails when workflow is not found", async () => {
            getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
            prismaMock.workflow.findFirst.mockResolvedValue(null)

            const result = await duplicateWorkflow("wf-1")

            expect(result).toEqual({ success: false, error: "Workflow not found" })
            expect(prismaMock.workflow.create).not.toHaveBeenCalled()
        })
    })

    describe("deleteWorkflow", () => {
        it("returns unauthorized when user is missing", async () => {
            getCurrentUserMock.mockResolvedValue(null)

            const result = await deleteWorkflow("wf-1")

            expect(result).toEqual({ success: false, error: "Unauthorized" })
            expect(prismaMock.workflow.findFirst).not.toHaveBeenCalled()
        })

        it("is idempotent when workflow does not exist", async () => {
            getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
            prismaMock.workflow.findFirst.mockResolvedValue(null)

            const result = await deleteWorkflow("wf-1")

            expect(result).toEqual({ success: true, data: { deleted: false } })
            expect(prismaMock.workflow.delete).not.toHaveBeenCalled()
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows")
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows/wf-1")
        })

        it("deletes existing workflow and revalidates related routes", async () => {
            getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
            prismaMock.workflow.findFirst.mockResolvedValue({ id: "workflow-1" })
            prismaMock.workflow.delete.mockResolvedValue({ id: "workflow-1" })

            const result = await deleteWorkflow("wf-1")

            expect(result).toEqual({ success: true, data: { deleted: true } })
            expect(prismaMock.workflow.delete).toHaveBeenCalledWith({ where: { id: "workflow-1" } })
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows")
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows/wf-1")
            expect(prismaMock.audit.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    entityType: "workflow",
                    entityId: "workflow-1",
                    attribute: "workflow.policy.delete",
                }),
            })
        })
    })

    describe("getWorkflow", () => {
        it("returns unauthorized when user is missing", async () => {
            getCurrentUserMock.mockResolvedValue(null)

            const result = await getWorkflow("wf-1")

            expect(result).toEqual({ success: false, error: "Unauthorized" })
        })

        it("returns workflow data when found", async () => {
            getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
            const payload = {
                id: "wf-1",
                name: "Team Approval",
                isActive: true,
                requestTypes: ["VACATION"],
                contractTypes: [],
                subjectRoles: [],
                departments: [],
                projectTypes: [],
                steps: [],
                watchers: [],
            }
            prismaMock.workflow.findFirst.mockResolvedValue({
                rules: payload,
            })

            const result = await getWorkflow("wf-1")

            expect(result).toEqual({ success: true, data: payload })
            expect(prismaMock.workflow.findFirst).toHaveBeenCalledWith({
                where: {
                    id: "wf-1",
                    companyId: "company-1",
                },
                select: { rules: true },
            })
        })

        it("returns error when workflow not found", async () => {
            getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
            prismaMock.workflow.findFirst.mockResolvedValue(null)

            const result = await getWorkflow("wf-1")

            expect(result).toEqual({ success: false, error: "Workflow not found" })
        })
    })
})

describe("workflow responsive layout regression checks", () => {
    it("keeps mobile and desktop workflow list layouts side-by-side", () => {
        const pagePath = path.join(process.cwd(), "app/(dashboard)/settings/workflows/page.tsx")
        const source = readFileSync(pagePath, "utf8")

        expect(source).toContain("sm:hidden")
        expect(source).toContain("hidden rounded-lg border border-neutral-200 bg-white sm:block")
        expect(source).toContain("openActionDialog(workflow, \"duplicate\")")
        expect(source).toContain("openActionDialog(workflow, \"delete\")")
        expect(source).toContain("Duplicate")
        expect(source).toContain("Delete")
    })

    it("keeps workflow builder controls and dialogs at touch-friendly heights", () => {
        const headerPath = path.join(process.cwd(), "components/workflows/workflow-builder-header.tsx")
        const stepsPath = path.join(process.cwd(), "components/workflows/workflow-steps.tsx")
        const headerSource = readFileSync(headerPath, "utf8")
        const stepsSource = readFileSync(stepsPath, "utf8")

        expect(headerSource).toContain("className=\"h-11 rounded-sm px-4\"")
        expect(stepsSource).toContain("className=\"h-11 gap-2 rounded-sm px-4\"")
        expect(stepsSource).toContain("AlertDialogCancel className=\"h-11 rounded-sm\"")
    })
})
