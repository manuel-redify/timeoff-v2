"use client"

import { useState } from "react"
import { WorkflowBuilderHeader } from "@/components/workflows/workflow-builder-header"

interface WorkflowBuilderPageProps {
    params: Promise<{
        id: string
    }>
}

export default function WorkflowBuilderPage({ params }: WorkflowBuilderPageProps) {
    // In a real implementation, you'd await params here
    // For now, we'll use a mock since this is a client component
    const [isNew] = useState(false)

    async function handleSave(data: { title: string; isActive: boolean }) {
        // TODO: Implement save logic
        console.log("Saving workflow:", data)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return (
        <div className="flex flex-col min-h-screen" data-testid="workflow-builder-page">
            <WorkflowBuilderHeader
                isNew={isNew}
                onSave={handleSave}
            />

            {/* Scrollable Content Area */}
            <main className="flex-1 p-6 space-y-6">
                {/* Placeholder Content - Tall content to test sticky header */}
                <div className="rounded-lg border border-neutral-200 bg-white p-6">
                    <p className="text-neutral-400">
                        Workflow builder interface will be implemented here.
                    </p>
                </div>

                {/* Spacer to test scrolling */}
                <div className="space-y-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-lg border border-neutral-200 bg-white p-6 h-32"
                        >
                            <p className="text-neutral-400">Content block {i + 1}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}
