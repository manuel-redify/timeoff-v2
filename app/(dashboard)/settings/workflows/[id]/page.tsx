import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@components/ui/button"
import { ArrowLeft } from "lucide-react"

interface WorkflowBuilderPageProps {
    params: Promise<{
        id: string
    }>
}

export async function generateMetadata({ params }: WorkflowBuilderPageProps): Promise<Metadata> {
    const { id } = await params
    return {
        title: id === "new" ? "Create Workflow" : "Edit Workflow",
        description: "Build and configure approval workflows.",
    }
}

export default async function WorkflowBuilderPage({ params }: WorkflowBuilderPageProps) {
    const { id } = await params
    const isNew = id === "new"

    return (
        <div className="space-y-6" data-testid="workflow-builder-page">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild className="rounded-sm">
                    <Link href="/settings/workflows" aria-label="Back to workflows">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h3 className="text-lg font-medium text-neutral-900">
                        {isNew ? "Create Workflow" : "Edit Workflow"}
                    </h3>
                    <p className="text-sm text-neutral-400">
                        {isNew
                            ? "Configure a new approval workflow with custom rules."
                            : `Editing workflow: ${id}`}
                    </p>
                </div>
            </div>

            {/* Placeholder Content */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
                <p className="text-neutral-400">
                    Workflow builder interface will be implemented here.
                </p>
                <p className="text-sm text-neutral-400 mt-2">
                    Workflow ID: <code className="bg-neutral-100 px-1 py-0.5 rounded">{id}</code>
                </p>
            </div>
        </div>
    )
}
