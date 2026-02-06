import { z } from "zod";

export const createUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(1, "First name is required"),
    lastname: z.string().min(1, "Last name is required"),
    roleId: z.string().uuid("Invalid role ID"),
    areaId: z.string().uuid("Invalid area ID").optional().or(z.literal("")),
    departmentId: z.string().uuid("Invalid department ID").optional().or(z.literal("")),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    country: z.string().length(2, "Country must be 2 characters").optional(),
    contractTypeId: z.string().uuid("Invalid contract type ID").optional(),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
