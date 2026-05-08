import { DateInput } from "@/components/admin/date-input";
import { NumberInput } from "@/components/admin/number-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

export const DEPARTMENT_CHOICES = [
  { id: "Management", name: "Management" },
  { id: "IT Team", name: "IT Team" },
  { id: "Digital Marketing Team", name: "Digital Marketing Team" },
  { id: "Content Creator Team", name: "Content Creator Team" },
  { id: "Accounts", name: "Accounts" },
  { id: "HR", name: "HR" },
];

export const STATUS_CHOICES = [
  { id: "active", name: "Active" },
  { id: "inactive", name: "Inactive" },
];

export const EmployeeInputs = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
    <TextInput source="name" label="Full Name" isRequired />
    <SelectInput
      source="department"
      label="Department"
      choices={DEPARTMENT_CHOICES}
      isRequired
    />
    <TextInput source="role" label="Role / Designation" />
    <TextInput source="phone" label="Phone" />
    <TextInput source="email" label="Email" />
    <DateInput source="joining_date" label="Joining Date" />
    <NumberInput source="salary" label="Salary (₹)" />
    <SelectInput
      source="status"
      label="Status"
      choices={STATUS_CHOICES}
      defaultValue="active"
    />
  </div>
);
