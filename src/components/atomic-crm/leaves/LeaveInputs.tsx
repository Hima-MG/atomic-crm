import { DateInput } from "@/components/admin/date-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";

export const LEAVE_TYPE_CHOICES = [
  { id: "annual", name: "Annual Leave" },
  { id: "sick", name: "Sick Leave" },
  { id: "casual", name: "Casual Leave" },
  { id: "other", name: "Other" },
];

export const LEAVE_STATUS_CHOICES = [
  { id: "pending", name: "Pending" },
  { id: "approved", name: "Approved" },
  { id: "rejected", name: "Rejected" },
];

export const LeaveInputs = ({ isAdmin = false }: { isAdmin?: boolean }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
    <ReferenceInput source="employee_id" reference="employees">
      <AutocompleteInput label="Employee" optionText="name" isRequired />
    </ReferenceInput>
    <SelectInput
      source="leave_type"
      label="Leave Type"
      choices={LEAVE_TYPE_CHOICES}
      isRequired
    />
    <DateInput source="start_date" label="Start Date" isRequired />
    <DateInput source="end_date" label="End Date" isRequired />
    <div className="md:col-span-2">
      <TextInput source="reason" label="Reason" multiline rows={3} />
    </div>
    {isAdmin && (
      <>
        <SelectInput
          source="status"
          label="Status"
          choices={LEAVE_STATUS_CHOICES}
          defaultValue="pending"
        />
        <div className="md:col-span-2">
          <TextInput
            source="admin_notes"
            label="Admin Notes"
            multiline
            rows={2}
          />
        </div>
      </>
    )}
  </div>
);
