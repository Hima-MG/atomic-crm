import { useRecordContext } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";
import { DateInput } from "@/components/admin/date-input";
import { EditButton } from "@/components/admin/edit-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { ReferenceField } from "@/components/admin/reference-field";
import { Badge } from "@/components/ui/badge";
import { TopToolbar } from "../layout/TopToolbar";
import { ATTENDANCE_STATUS_CHOICES } from "./AttendanceInputs";
import type { Attendance } from "../types";

const STATUS_COLORS: Record<string, string> = {
  present:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0",
  absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0",
  "half-day":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0",
  leave:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0",
};

const StatusBadge = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Attendance>();
  if (!record) return null;
  const label =
    ATTENDANCE_STATUS_CHOICES.find((c) => c.id === record.status)?.name ??
    record.status;
  return <Badge className={STATUS_COLORS[record.status] ?? ""}>{label}</Badge>;
};

const WorkingHoursField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Attendance>();
  if (!record?.working_hours)
    return <span className="text-muted-foreground">—</span>;
  return <span>{record.working_hours}h</span>;
};

// Computed once at module load — stable reference, no per-render cost
const TODAY = new Date().toISOString().slice(0, 10);

const filters = [
  <ReferenceInput source="employee_id" reference="employees" alwaysOn>
    <AutocompleteInput
      label="Employee"
      optionText="name"
      placeholder="All Employees"
    />
  </ReferenceInput>,
  <DateInput source="date" label="Date" alwaysOn />,
  <SelectInput
    source="status"
    label="Status"
    choices={ATTENDANCE_STATUS_CHOICES}
    emptyText="All"
  />,
];

const AttendanceActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="Mark Attendance" />
  </TopToolbar>
);

export const AttendanceList = () => (
  <List
    filters={filters}
    filterDefaultValues={{ date: TODAY }}
    actions={<AttendanceActions />}
    sort={{ field: "date", order: "DESC" }}
    title="Attendance"
  >
    <DataTable>
      <DataTable.Col source="date" />
      <DataTable.Col label="Employee">
        <ReferenceField source="employee_id" reference="employees" link="show">
          <span />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="check_in" label="Check In" />
      <DataTable.Col source="check_out" label="Check Out" />
      <DataTable.Col label="Hours">
        <WorkingHoursField />
      </DataTable.Col>
      <DataTable.Col label="Status">
        <StatusBadge />
      </DataTable.Col>
      <DataTable.Col label={false}>
        <div className="flex gap-1">
          <EditButton />
          <DeleteButton redirect={false} />
        </div>
      </DataTable.Col>
    </DataTable>
  </List>
);
