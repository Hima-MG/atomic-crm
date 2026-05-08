import { DateInput } from "@/components/admin/date-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";

export const QUALIFICATION_CHOICES = [
  { id: "ITI", name: "ITI" },
  { id: "Diploma", name: "Diploma" },
  { id: "BTech", name: "BTech" },
  { id: "Surveyor", name: "Surveyor" },
];

export const LEAD_SOURCE_CHOICES = [
  { id: "Website", name: "Website" },
  { id: "Referral", name: "Referral" },
  { id: "Social Media", name: "Social Media" },
  { id: "Walk-in", name: "Walk-in" },
  { id: "Phone", name: "Phone" },
  { id: "Other", name: "Other" },
];

export const STAGE_CHOICES = [
  { id: "new-lead", name: "New Lead" },
  { id: "contacted", name: "Contacted" },
  { id: "interested", name: "Interested" },
  { id: "follow-up", name: "Follow-up" },
  { id: "joined", name: "Joined" },
  { id: "closed", name: "Closed" },
];

export const StudentInputs = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
      <TextInput source="full_name" label="Student Name" isRequired />
      <TextInput source="phone" label="Phone Number" />
      <SelectInput
        source="qualification"
        label="Course Level"
        choices={QUALIFICATION_CHOICES}
        emptyText="— Select —"
      />
      <TextInput source="interested_course" label="Course Interested" />
      <SelectInput
        source="lead_source"
        label="Lead Source"
        choices={LEAD_SOURCE_CHOICES}
        emptyText="— Select —"
      />
      <ReferenceInput source="counselor_id" reference="sales">
        <AutocompleteInput
          label="Assigned Counselor"
          optionText={(r: any) => (r ? `${r.first_name} ${r.last_name}` : "")}
        />
      </ReferenceInput>
      <SelectInput
        source="stage"
        label="Lead Status"
        choices={STAGE_CHOICES}
        defaultValue="new-lead"
      />
      <DateInput source="follow_up_date" label="Follow-up Date" />
      <div className="md:col-span-2">
        <TextInput source="notes" label="Remarks" multiline rows={3} />
      </div>
    </div>
  );
};
