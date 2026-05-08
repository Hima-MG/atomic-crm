import { useEffect } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { DateInput } from "@/components/admin/date-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";

export const TASK_CATEGORY_CHOICES = [
  { id: "Content Creation", name: "Content Creation" },
  { id: "Video/Reel Preparation", name: "Video/Reel Preparation" },
  { id: "Website & App Management", name: "Website & App Management" },
  { id: "Student Support", name: "Student Support" },
  { id: "Admissions & Enrollments", name: "Admissions & Enrollments" },
  { id: "Social Media", name: "Social Media" },
  { id: "Admin & Accounts", name: "Admin & Accounts" },
  { id: "Meetings/Sessions", name: "Meetings/Sessions" },
  { id: "Research & Learning", name: "Research & Learning" },
  { id: "Miscellaneous", name: "Miscellaneous" },
];

export const TASK_STATUS_CHOICES = [
  { id: "pending", name: "Pending" },
  { id: "under-review", name: "Under Review" },
  { id: "completed", name: "Completed" },
];

/** Auto-calculates total_time (hours) from start_time and end_time strings (HH:MM). */
const TotalTimeCalculator = () => {
  const startTime = useWatch({ name: "start_time" });
  const endTime = useWatch({ name: "end_time" });
  const { setValue } = useFormContext();

  useEffect(() => {
    if (!startTime || !endTime) return;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return;
    const totalMins = eh * 60 + em - (sh * 60 + sm);
    if (totalMins > 0) {
      setValue("total_time", parseFloat((totalMins / 60).toFixed(2)), {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [startTime, endTime, setValue]);

  return null;
};

export const DailyTaskInputs = ({ isAdmin = false }: { isAdmin?: boolean }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
    <TotalTimeCalculator />
    <ReferenceInput source="employee_id" reference="employees">
      <AutocompleteInput label="Employee" optionText="name" isRequired />
    </ReferenceInput>
    <DateInput source="submission_date" label="Date" isRequired />
    <div className="md:col-span-2">
      <SelectInput
        source="category"
        label="Task Category"
        choices={TASK_CATEGORY_CHOICES}
        isRequired
      />
    </div>
    <div className="md:col-span-2">
      <TextInput source="task_title" label="Task Description" isRequired />
    </div>
    <TextInput
      source="start_time"
      label="Start Time (HH:MM)"
      placeholder="09:00"
    />
    <TextInput source="end_time" label="End Time (HH:MM)" placeholder="10:30" />
    <TextInput
      source="total_time"
      label="Total Time (hrs) — auto-calculated"
      disabled
    />
    <SelectInput
      source="status"
      label="Status"
      choices={TASK_STATUS_CHOICES}
      defaultValue="pending"
    />
    <div className="md:col-span-2">
      <TextInput
        source="description"
        label="Notes / Details"
        multiline
        rows={3}
      />
    </div>
    {isAdmin && (
      <div className="md:col-span-2">
        <TextInput
          source="admin_notes"
          label="Admin Feedback"
          multiline
          rows={2}
        />
      </div>
    )}
  </div>
);
