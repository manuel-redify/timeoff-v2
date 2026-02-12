"use client"

import React, { useEffect, useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { TriggersBlock } from "@/components/workflows/triggers-block"
import { getWorkflowOptions, WorkflowOptions } from "@/app/actions/workflow/get-options"
import { workflowSchema, WorkflowFormValues } from "@/lib/validations/workflow"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

export default function TestTriggersPage() {
    const [options, setOptions] = useState<WorkflowOptions | null>(null)
    const [loading, setLoading] = useState(true)

    const methods = useForm<WorkflowFormValues>({
        resolver: zodResolver(workflowSchema) as any,
        defaultValues: {
            name: "Test Workflow",
            isActive: true,
            requestTypes: [],
            contractTypes: ["any"],
            subjectRoles: ["any"],
            departments: ["any"],
            projectTypes: ["any"],
        }
    })

    useEffect(() => {
        async function load() {
            try {
                const data = await getWorkflowOptions()
                setOptions(data)
            } catch (e) {
                console.error("Failed to load options", e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const onSubmit = (data: WorkflowFormValues) => {
        console.log("Form Data:", data)
        alert(JSON.stringify(data, null, 2))
    }

    if (loading) return <div>Loading options...</div>
    if (!options) return <div>Failed to load options</div>

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Triggers Block Test</h1>

            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
                    <TriggersBlock options={options} />

                    <Button type="submit">Submit (Check Console/Alert)</Button>
                </form>
            </FormProvider>

            <div className="p-4 bg-slate-100 rounded-md">
                <h3 className="font-medium mb-2">Current Form Values:</h3>
                <pre className="text-xs overflow-auto max-h-60">
                    {JSON.stringify(methods.watch(), null, 2)}
                </pre>
            </div>
        </div>
    )
}
