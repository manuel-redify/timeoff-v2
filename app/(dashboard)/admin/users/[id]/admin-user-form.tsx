"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

export default function AdminUserForm({ user, departments, roles }: { user: any, departments: any[], roles: any[] }) {
    const [formData, setFormData] = useState({
        name: user.name,
        lastname: user.lastname,
        country: user.country || "",
        departmentId: user.departmentId || "",
        defaultRoleId: user.defaultRoleId || "",
        isAdmin: user.isAdmin,
        isAutoApprove: user.isAutoApprove,
        activated: user.activated,
        contractType: user.contractType,
        endDate: user.endDate ? new Date(user.endDate).toISOString().split('T')[0] : "",
    });

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update user');
            }

            setMessage({ type: 'success', text: 'Employee account has been updated successfully.' });
            router.refresh();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">First Name</label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-white h-11"
                        placeholder="First Name"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Last Name</label>
                    <Input
                        value={formData.lastname}
                        onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                        required
                        className="bg-white h-11"
                        placeholder="Last Name"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Department</label>
                    <select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        className="w-full h-11 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                    >
                        <option value="">Unassigned</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">System Role</label>
                    <select
                        value={formData.defaultRoleId}
                        onChange={(e) => setFormData({ ...formData, defaultRoleId: e.target.value })}
                        className="w-full h-11 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                    >
                        <option value="">Default (Employee)</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Contract Type</label>
                    <select
                        value={formData.contractType}
                        onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                        className="w-full h-11 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                    >
                        <option value="Employee">Employee</option>
                        <option value="Contractor">Contractor</option>
                        <option value="Part-time">Part-time</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Country</label>
                    <select
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full h-11 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                    >
                        <option value="">Select Country</option>
                        {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Termination Date (optional)</label>
                    <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="bg-white h-11"
                    />
                    <p className="text-[11px] text-slate-400 font-semibold px-1 italic">User will be unable to log in after this date.</p>
                </div>
            </div>

            <div className="border-t border-slate-100 pt-10">
                <h3 className="text-xl font-bold text-slate-900 mb-8 border-l-4 border-blue-600 pl-4">Permissions & Access</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start justify-between p-5 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                        <div className="pr-4">
                            <p className="font-bold text-slate-900 mb-1">Administrator Rights</p>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Full access to company settings, entire user base, and system-wide reporting.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={formData.isAdmin}
                            onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                            className="size-6 mt-1 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-start justify-between p-5 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                        <div className="pr-4">
                            <p className="font-bold text-slate-900 mb-1">Auto-Approve Leave</p>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Skip the approval workflow. All requests from this user will be instantly approved.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={formData.isAutoApprove}
                            onChange={(e) => setFormData({ ...formData, isAutoApprove: e.target.checked })}
                            className="size-6 mt-1 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-start justify-between p-5 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                        <div className="pr-4">
                            <p className="font-bold text-slate-900 mb-1">Account Enabled</p>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Allow the user to log in and use the application functions.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={formData.activated}
                            onChange={(e) => setFormData({ ...formData, activated: e.target.checked })}
                            className="size-6 mt-1 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

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

            <div className="flex justify-end gap-4 pt-10 border-t border-slate-100">
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
                        <div className="flex items-center gap-2 text-white">
                            <span className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                            Updating...
                        </div>
                    ) : 'Update Employee'}
                </Button>
            </div>
        </form>
    );
}
