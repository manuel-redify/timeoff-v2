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
        comment: {
            findFirst: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
    },
}))

const prismaMock = prisma as unknown as {
    comment: {
        findFirst: jest.Mock
        create: jest.Mock
        delete: jest.Mock
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
            expect(prismaMock.comment.findFirst).not.toHaveBeenCalled()
        })

        it("duplicates workflow payload with new id and copy suffix", async () => {
            getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
            prismaMock.comment.findFirst.mockResolvedValue({
                comment: JSON.stringify({
                    id: "wf-1",
                    name: "Team Approval",
                    steps: [{ id: "s1", resolver: "ROLE" }],
                    watchers: [{ id: "w1" }],
                }),
            })
            prismaMock.comment.create.mockResolvedValue({ id: "comment-2" })

            const result = await duplicateWorkflow("wf-1")

            expect(result).toEqual({ success: true, data: { id: "wf-copy-1" } })
            expect(prismaMock.comment.create).toHaveBeenCalledTimes(1)

            const createArgs = prismaMock.comment.create.mock.calls[0][0]
            const payload = JSON.parse(createArgs.data.comment)
            expect(payload.id).toBe("wf-copy-1")
            expect(payload.name).toBe("Team Approval (Copy)")
            expect(payload.steps).toEqual([{ id: "s1", resolver: "ROLE" }])
            expect(payload.watchers).toEqual([{ id: "w1" }])

            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows")
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows/wf-1")
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows/wf-copy-1")
        })

        it("fails when payload is invalid JSON", async () => {
            getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
            prismaMock.comment.findFirst.mockResolvedValue({ comment: "{invalid-json" })

            const result = await duplicateWorkflow("wf-1")

            expect(result).toEqual({ success: false, error: "Workflow payload is invalid" })
            expect(prismaMock.comment.create).not.toHaveBeenCalled()
        })
    })

    describe("deleteWorkflow", () => {
        it("returns unauthorized when user is missing", async () => {
            getCurrentUserMock.mockResolvedValue(null)

            const result = await deleteWorkflow("wf-1")

            expect(result).toEqual({ success: false, error: "Unauthorized" })
            expect(prismaMock.comment.findFirst).not.toHaveBeenCalled()
        })

        it("is idempotent when workflow does not exist", async () => {
            getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
            prismaMock.comment.findFirst.mockResolvedValue(null)

            const result = await deleteWorkflow("wf-1")

            expect(result).toEqual({ success: true, data: { deleted: false } })
            expect(prismaMock.comment.delete).not.toHaveBeenCalled()
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows")
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows/wf-1")
        })

        it("deletes existing workflow and revalidates related routes", async () => {
            getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
            prismaMock.comment.findFirst.mockResolvedValue({ id: "comment-1" })
            prismaMock.comment.delete.mockResolvedValue({ id: "comment-1" })

            const result = await deleteWorkflow("wf-1")

            expect(result).toEqual({ success: true, data: { deleted: true } })
            expect(prismaMock.comment.delete).toHaveBeenCalledWith({ where: { id: "comment-1" } })
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows")
            expect(revalidatePathMock).toHaveBeenCalledWith("/settings/workflows/wf-1")
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
            prismaMock.comment.findFirst.mockResolvedValue({
                comment: JSON.stringify(payload),
            })

            const result = await getWorkflow("wf-1")

            expect(result).toEqual({ success: true, data: payload })
            expect(prismaMock.comment.findFirst).toHaveBeenCalledWith({
                where: {
                    companyId: "company-1",
                    entityType: "WORKFLOW_POLICY",
                    entityId: "wf-1",
                },
                select: { comment: true },
            })
        })

        it("returns error when workflow not found", async () => {
            getCurrentUserMock.mockResolvedValue({ id: "user-1", companyId: "company-1" })
            prismaMock.comment.findFirst.mockResolvedValue(null)

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
        expect(source).toContain("data-testid={`duplicate-workflow-mobile-${workflow.id}`}")
        expect(source).toContain("data-testid={`delete-workflow-mobile-${workflow.id}`}")
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
