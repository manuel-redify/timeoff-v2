"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function ProfileForm({ user }: { user: any }) {
    const [name, setName] = useState(user.name);
    const [lastname, setLastname] = useState(user.lastname);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, lastname }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update profile');
            }

            setMessage({ type: 'success', text: 'Your profile has been updated successfully.' });
            router.refresh();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-slate-700">First Name</label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John"
                        required
                        className="bg-white"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="lastname" className="text-sm font-semibold text-slate-700">Last Name</label>
                    <Input
                        id="lastname"
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                        placeholder="e.g. Doe"
                        required
                        className="bg-white"
                    />
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg text-sm font-medium animate-in fade-in duration-300 ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'}`}
                >
                    {message.text}
                </div>
            )}

            <div className="pt-2">
                <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Saving...
                        </div>
                    ) : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}
