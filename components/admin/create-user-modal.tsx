"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContractTypes } from "@/hooks/use-contract-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createUser } from "@/lib/actions/user";
import { createUserSchema, type CreateUserSchema } from "@/lib/validations/user";
import { PlusIcon, Loader2 } from "lucide-react";

interface CreateUserModalProps {
  departments: any[];
  roles: any[];
  areas: any[];
}

export default function CreateUserModal({ departments, roles, areas }: CreateUserModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { contractTypes, loading: contractTypesLoading, error: contractTypesError } = useContractTypes();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CreateUserSchema>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      lastname: "",
      email: "",
      roleId: "",
      departmentId: "",
      areaId: "",
      country: "GB",
      contractTypeId: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
    }
  });

  const watchDepartmentId = watch("departmentId");
  const watchRoleId = watch("roleId");
  const watchAreaId = watch("areaId");
  const watchCountry = watch("country");
  const watchContractTypeId = watch("contractTypeId");

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const onFormSubmit = async (data: CreateUserSchema) => {
    setIsSubmitting(true);
    try {
      // Standardize empty strings to undefined to match backend expectations
      const payload = {
        ...data,
        areaId: data.areaId || undefined,
        departmentId: data.departmentId || undefined,
        contractTypeId: data.contractTypeId === "default" || !data.contractTypeId ? undefined : data.contractTypeId,
        endDate: data.endDate || undefined,
      };

      const result = await createUser(payload);

      if (result.success) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">User created successfully!</span>
            <span className="text-sm text-slate-600">
              {result.emailSent ? "Welcome email sent." : `Email delivery failed: ${result.emailError || 'Unknown error'}`}
            </span>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  router.push(`/admin/users/${result.userId}`);
                  setOpen(false);
                }}
              >
                View User
              </Button>
            </div>
          </div>
        );
        setOpen(false);
        reset();
      } else {
        toast.error(result.error || "Failed to create user");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-semibold">
          <PlusIcon className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Create New User
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                First Name *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter first name"
                className={errors.name ? "border-red-500 bg-white" : "bg-white"}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastname" className="text-sm font-semibold text-slate-700">
                Last Name *
              </Label>
              <Input
                id="lastname"
                {...register("lastname")}
                placeholder="Enter last name"
                className={errors.lastname ? "border-red-500 bg-white" : "bg-white"}
              />
              {errors.lastname && <p className="text-xs text-red-500">{errors.lastname.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="user@company.com"
                className={errors.email ? "border-red-500 bg-white" : "bg-white"}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="departmentId" className="text-sm font-semibold text-slate-700">
                Department
              </Label>
              <Select
                value={watchDepartmentId || ""}
                onValueChange={(value) => setValue("departmentId", value === "__none__" ? "" : value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && <p className="text-xs text-red-500">{errors.departmentId.message}</p>}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="roleId" className="text-sm font-semibold text-slate-700">
                Role *
              </Label>
              <Select
                value={watchRoleId || ""}
                onValueChange={(value) => setValue("roleId", value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleId && <p className="text-xs text-red-500">{errors.roleId.message}</p>}
            </div>

            {/* Area */}
            <div className="space-y-2">
              <Label htmlFor="areaId" className="text-sm font-semibold text-slate-700">
                Area
              </Label>
              <Select
                value={watchAreaId || ""}
                onValueChange={(value) => setValue("areaId", value === "__none__" ? "" : value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Area</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.areaId && <p className="text-xs text-red-500">{errors.areaId.message}</p>}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-semibold text-slate-700">
                Country
              </Label>
              <Select
                value={watchCountry || ""}
                onValueChange={(value) => setValue("country", value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="IT">Italy</SelectItem>
                  {/* ... add others as needed */}
                </SelectContent>
              </Select>
              {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
            </div>

            {/* Contract Type */}
            <div className="space-y-2">
              <Label htmlFor="contractType" className="text-sm font-semibold text-slate-700">
                Contract Type
              </Label>
              <Select
                value={watchContractTypeId || ""}
                onValueChange={(value) => setValue("contractTypeId", value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={contractTypesLoading ? "Loading..." : contractTypesError ? "Error" : "Select contract type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (Employee)</SelectItem>
                  {!contractTypesLoading && !contractTypesError && contractTypes.map((ct) => (
                    <SelectItem key={ct.id} value={ct.id || 'unknown'}>
                      {ct.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contractTypeId && <p className="text-xs text-red-500">{errors.contractTypeId.message}</p>}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-semibold text-slate-700">
                End Date (Optional)
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className="bg-white"
              />
              {errors.endDate && <p className="text-xs text-red-500">{errors.endDate.message}</p>}
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating User...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}