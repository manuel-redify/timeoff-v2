"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectAssignmentsCard, ProjectAssignment, Project, Role } from "@/components/users/project-assignments-card";
import { useRouter } from "next/navigation";

interface ProjectAssignmentsFormProps {
    userId: string;
    roles: any[];
}

export function ProjectAssignmentsForm({ userId, roles }: ProjectAssignmentsFormProps) {
    const router = useRouter();
    const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Load user assignments
    const loadUserAssignments = useCallback(async () => {
        setLoadingAssignments(true);
        try {
            const res = await fetch(`/api/users/${userId}/projects`);
            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setAssignments(result.data || []);
                }
            } else {
                console.error('Failed to load assignments:', res.status, res.statusText);
            }
        } catch (error) {
            console.error('Failed to load user assignments:', error);
        } finally {
            setLoadingAssignments(false);
        }
    }, [userId]);

    // Load available projects
    const loadProjects = useCallback(async () => {
        setLoadingProjects(true);
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setProjects(result.data || []);
                }
            } else {
                console.error('Failed to load projects:', res.status, res.statusText);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoadingProjects(false);
        }
    }, []);

    useEffect(() => {
        if (userId) {
            loadUserAssignments();
            loadProjects();
        }
    }, [userId, loadUserAssignments, loadProjects]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch(`/api/users/${userId}/projects`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('Failed to sync project assignments:', data);
                const errorMessage = data.error?.message || data.error || 'Failed to sync project assignments';
                throw new Error(errorMessage);
            }

            console.log('Project assignments synced:', data);
            // Re-fetch assignments to verify and update local state
            await loadUserAssignments();

            setMessage({ type: 'success', text: 'Project assignments have been updated successfully.' });
            router.refresh();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    const isLoading = loadingProjects || loadingAssignments;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            ) : (
                <>
                    <ProjectAssignmentsCard
                        assignments={assignments}
                        projects={projects}
                        roles={roles}
                        onChange={setAssignments}
                    />

                    {message && (
                        <div className={`p-5 rounded-2xl text-sm font-bold border-2 animate-in zoom-in-95 duration-200 ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100 shadow-sm shadow-emerald-100'
                            : 'bg-rose-50 text-rose-800 border-rose-100 shadow-sm shadow-rose-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`size-2 rounded-full ${message.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} animate-pulse`}></div>
                                {message.text}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                            className="font-bold text-slate-600 hover:bg-slate-100 h-11 px-6"
                        >
                            Discard Changes
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="min-w-[170px] font-bold h-11 px-8 shadow-lg shadow-blue-600/20"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin mr-2">⟳</span>
                                    Saving...
                                </>
                            ) : (
                                'Save Assignments'
                            )}
                        </Button>
                    </div>
                </>
            )}
        </form>
    );
}
