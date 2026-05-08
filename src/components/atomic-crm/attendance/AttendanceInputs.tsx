import { DateInput } from "@/components/admin/date-input";
import { NumberInput } from "@/components/admin/number-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { TextInput } from "@/components/admin/text-input";

export const ATTENDANCE_STATUS_CHOICES = [
  { id: "present", name: "Present" },
  { id: "absent", name: "Absent" },
  { id: "half-day", name: "Half Day" },
  { id: "leave", name: "On Leave" },
];

export const AttendanceInputs = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
    <ReferenceInput source="employee_id" reference="employees">
      <AutocompleteInput label="Employee" optionText="name" isRequired />
    </ReferenceInput>
    <DateInput source="date" label="Date" isRequired />
    <TextInput source="check_in" label="Check In (HH:MM)" placeholder="09:00" />
    <TextInput
      source="check_out"
      label="Check Out (HH:MM)"
      placeholder="18:00"
    />
    <NumberInput source="working_hours" label="Working Hours" step={0.5} />
    <SelectInput
      source="status"
      label="Status"
      choices={ATTENDANCE_STATUS_CHOICES}
      defaultValue="present"
      isRequired
    />
  </div>
);
