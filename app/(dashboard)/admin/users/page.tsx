import { isAdmin } from "@/lib/rbac";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import UserListTable from "./user-list-table";
import CreateUserModal from "@/components/admin/create-user-modal";
import { serializeData } from "@/lib/serialization";

export default async function AdminUsersPage() {
    if (!await isAdmin()) {
        redirect("/");
    }

    const users = await prisma.user.findMany({
        where: { deletedAt: null },
        include: {
            department: true,
            defaultRole: true,
        },
        orderBy: {
            lastname: 'asc'
        }
    });

    const departments = await prisma.department.findMany({
        where: { deletedAt: null }
    });

const roles = await prisma.role.findMany();

    const areas = await prisma.area.findMany();

    const serializedUsers = serializeData(users);
    const serializedDepartments = serializeData(departments);
    const serializedAreas = serializeData(areas);

return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-slate-500 mt-1 text-lg">Manage employee accounts, roles, and departments across the organization.</p>
                </div>
                <CreateUserModal
                    departments={serializedDepartments}
                    roles={roles}
                    areas={serializedAreas}
                />
            </div>

            <UserListTable
                initialUsers={serializedUsers}
                departments={serializedDepartments}
                roles={roles}
            />
        </div>
    );
}
