"use client"

import React, { useState } from "react"
import { MultiSelect, Option } from "@/components/ui/multi-select"

const OPTIONS: Option[] = [
    { value: "all", label: "All Departments", exclusive: true },
    { value: "engineering", label: "Engineering", count: 12 },
    { value: "design", label: "Design", count: 5 },
    { value: "marketing", label: "Marketing", count: 3 },
    { value: "sales", label: "Sales", disabled: true },
]

export default function TestPage() {
    const [selected, setSelected] = useState<string[]>([])

    return (
        <div className="p-10 max-w-md mx-auto space-y-8">
            <h1 className="text-2xl font-bold">MultiSelect Test</h1>

            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Department Selection</h2>
                <MultiSelect
                    options={OPTIONS}
                    selected={selected}
                    onChange={setSelected}
                    placeholder="Select departments..."
                    label="Departments"
                />
            </div>

            <div className="p-4 bg-slate-100 rounded-md">
                <h3 className="font-medium mb-2">Selected Values:</h3>
                <pre className="text-sm">{JSON.stringify(selected, null, 2)}</pre>
            </div>

            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Instructions</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Select "Engineering". "All Departments" should NOT be selected.</li>
                    <li>Select "All Departments". "Engineering" should be deselected.</li>
                    <li>Select "Design" while "All Departments" is selected. "All Departments" should be deselected.</li>
                    <li>"Sales" should be disabled.</li>
                </ul>
            </div>
        </div>
    )
}
