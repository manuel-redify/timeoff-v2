import { isAdmin, getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import UserListTable from "./user-list-table";
import CreateUserModal from "@/components/admin/create-user-modal";
import { serializeData } from "@/lib/serialization";

export default async function AdminUsersPage() {
    if (!await isAdmin()) {
        redirect("/");
    }

    // Get current user to filter by company
    const currentUser = await getCurrentUser();
    const companyId = currentUser?.companyId;
    
    if (!companyId) {
        redirect("/");
    }

    const users = await prisma.user.findMany({
        where: { 
            deletedAt: null,
            companyId: companyId
        },
        include: {
            department: true,
            defaultRole: true,
            area: true,
            contractType: true,
            projects: {
                include: {
                    project: true
                }
            }
        },
        orderBy: {
            lastname: 'asc'
        }
    });

    const departments = await prisma.department.findMany({
        where: { 
            deletedAt: null,
            companyId: companyId
        }
    });
    
    const roles = await prisma.role.findMany({
        where: { companyId }
    });

    const areas = await prisma.area.findMany({
        where: { companyId }
    });

    const projects = await prisma.project.findMany({
        where: { 
            companyId: companyId,
            status: 'active'
        }
    });

    const contractTypes = await prisma.contractType.findMany();

    const serializedUsers = serializeData(users);
    const serializedDepartments = serializeData(departments);
    const serializedAreas = serializeData(areas);
    const serializedProjects = serializeData(projects);
    const serializedContractTypes = serializeData(contractTypes);

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
                areas={serializedAreas}
                contractTypes={serializedContractTypes}
                projects={serializedProjects}
            />
        </div>
    );
}
