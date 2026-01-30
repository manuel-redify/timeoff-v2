"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
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
import { PlusIcon } from "lucide-react";

interface CreateUserModalProps {
  departments: any[];
  roles: any[];
  areas: any[];
}

const initialState = {
  success: false,
  error: "",
  userId: "",
  emailSent: false,
  emailError: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button 
      type="submit" 
      className="w-full" 
      disabled={pending}
    >
      {pending ? "Creating User..." : "Create User"}
    </Button>
  );
}

export default function CreateUserModal({ departments, roles, areas }: CreateUserModalProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const params = {
        email: formData.get('email') as string,
        name: formData.get('name') as string,
        lastname: formData.get('lastname') as string,
        roleId: formData.get('roleId') as string,
        areaId: formData.get('areaId') as string || undefined,
        departmentId: formData.get('departmentId') as string || undefined,
        startDate: formData.get('startDate') as string || undefined,
        endDate: formData.get('endDate') as string || undefined,
        country: formData.get('country') as string || undefined,
        contractType: formData.get('contractType') as string || undefined,
      };
      
      return await createUser(params);
    },
    initialState
  );
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    departmentId: "",
    roleId: "",
    areaId: "",
    country: "",
    contractType: "Employee",
    isAdmin: false,
    endDate: "",
  });

  // Handle successful user creation
  if (state.success && state.userId && open) {
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-semibold">User created successfully!</span>
        <span className="text-sm text-slate-600">
          {state.emailSent ? "Welcome email sent." : "Email delivery failed."}
        </span>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              router.push(`/admin/users/${state.userId}`);
              setOpen(false);
            }}
          >
            View User
          </Button>
          <Button
            size="sm"
            onClick={() => {
              router.refresh();
              setOpen(false);
              // Reset form
              setFormData({
                firstName: "",
                lastName: "",
                email: "",
                departmentId: "",
                roleId: "",
                areaId: "",
                country: "",
                contractType: "Employee",
                isAdmin: false,
                endDate: "",
              });
            }}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  // Handle errors
  if (state.error && open) {
    toast.error(state.error);
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.roleId) {
      toast.error("Role is required");
      return false;
    }
    return true;
  };

  const handleSubmit = (formData: FormData) => {
    if (!validateForm()) {
      return;
    }
    
    // The form action will be called automatically
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
        
        <form action={formAction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
                First Name *
              </Label>
              <Input
                id="firstName"
                name="name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
                className="bg-white"
                required
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">
                Last Name *
              </Label>
              <Input
                id="lastName"
                name="lastname"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter last name"
                className="bg-white"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="user@company.com"
                className="bg-white"
                required
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="departmentId" className="text-sm font-semibold text-slate-700">
                Department
              </Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => handleInputChange("departmentId", value)}
                name="departmentId"
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="roleId" className="text-sm font-semibold text-slate-700">
                Role *
              </Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => handleInputChange("roleId", value)}
                name="roleId"
                required
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
            </div>

            {/* Area */}
            <div className="space-y-2">
              <Label htmlFor="areaId" className="text-sm font-semibold text-slate-700">
                Area
              </Label>
              <Select
                value={formData.areaId}
                onValueChange={(value) => handleInputChange("areaId", value)}
                name="areaId"
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Area</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-semibold text-slate-700">
                Country
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleInputChange("country", value)}
                name="country"
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="ES">Spain</SelectItem>
                  <SelectItem value="IT">Italy</SelectItem>
                  <SelectItem value="NL">Netherlands</SelectItem>
                  <SelectItem value="SE">Sweden</SelectItem>
                  <SelectItem value="NO">Norway</SelectItem>
                  <SelectItem value="DK">Denmark</SelectItem>
                  <SelectItem value="FI">Finland</SelectItem>
                  <SelectItem value="CH">Switzerland</SelectItem>
                  <SelectItem value="AT">Austria</SelectItem>
                  <SelectItem value="BE">Belgium</SelectItem>
                  <SelectItem value="IE">Ireland</SelectItem>
                  <SelectItem value="PT">Portugal</SelectItem>
                  <SelectItem value="GR">Greece</SelectItem>
                  <SelectItem value="CZ">Czech Republic</SelectItem>
                  <SelectItem value="PL">Poland</SelectItem>
                  <SelectItem value="HU">Hungary</SelectItem>
                  <SelectItem value="RO">Romania</SelectItem>
                  <SelectItem value="BG">Bulgaria</SelectItem>
                  <SelectItem value="HR">Croatia</SelectItem>
                  <SelectItem value="SI">Slovenia</SelectItem>
                  <SelectItem value="SK">Slovakia</SelectItem>
                  <SelectItem value="EE">Estonia</SelectItem>
                  <SelectItem value="LV">Latvia</SelectItem>
                  <SelectItem value="LT">Lithuania</SelectItem>
                  <SelectItem value="LU">Luxembourg</SelectItem>
                  <SelectItem value="MT">Malta</SelectItem>
                  <SelectItem value="CY">Cyprus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contract Type */}
            <div className="space-y-2">
              <Label htmlFor="contractType" className="text-sm font-semibold text-slate-700">
                Contract Type
              </Label>
              <Select
                value={formData.contractType}
                onValueChange={(value) => handleInputChange("contractType", value)}
                name="contractType"
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Contractor">Contractor</SelectItem>
                  <SelectItem value="Intern">Intern</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-semibold text-slate-700">
                End Date (Optional)
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className="bg-white"
              />
            </div>

            {/* Is Admin */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isAdmin"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onCheckedChange={(checked) => handleInputChange("isAdmin", checked)}
                />
                <Label htmlFor="isAdmin" className="text-sm font-semibold text-slate-700">
                  Administrator Access
                </Label>
              </div>
              <p className="text-xs text-slate-500">
                Grant this user administrative privileges to manage other users and system settings.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}