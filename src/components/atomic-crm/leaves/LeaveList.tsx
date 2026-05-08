import { useRecordContext } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SelectInput } from "@/components/admin/select-input";
import { EditButton } from "@/components/admin/edit-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { ReferenceField } from "@/components/admin/reference-field";
import { Badge } from "@/components/ui/badge";
import { TopToolbar } from "../layout/TopToolbar";
import { LEAVE_TYPE_CHOICES, LEAVE_STATUS_CHOICES } from "./LeaveInputs";
import type { Leave } from "../types";

const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0",
  approved:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0",
  rejected:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0",
};

const StatusBadge = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Leave>();
  if (!record) return null;
  const label =
    LEAVE_STATUS_CHOICES.find((c) => c.id === record.status)?.name ??
    record.status;
  return <Badge className={STATUS_COLORS[record.status] ?? ""}>{label}</Badge>;
};

const LeaveTypeField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Leave>();
  if (!record) return null;
  return (
    <span>
      {LEAVE_TYPE_CHOICES.find((c) => c.id === record.leave_type)?.name ??
        record.leave_type}
    </span>
  );
};

const DurationField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Leave>();
  if (!record?.start_date || !record?.end_date) return null;
  const days =
    Math.ceil(
      (new Date(record.end_date).getTime() -
        new Date(record.start_date).getTime()) /
        86400000,
    ) + 1;
  return (
    <span className="text-sm">
      {days} day{days !== 1 ? "s" : ""}
    </span>
  );
};

const filters = [
  <ReferenceInput source="employee_id" reference="employees" alwaysOn>
    <AutocompleteInput
      label="Employee"
      optionText="name"
      placeholder="All Employees"
    />
  </ReferenceInput>,
  <SelectInput
    source="status"
    label="Status"
    choices={LEAVE_STATUS_CHOICES}
    emptyText="All"
    alwaysOn
  />,
  <SelectInput
    source="leave_type"
    label="Leave Type"
    choices={LEAVE_TYPE_CHOICES}
    emptyText="All"
  />,
];

const LeaveActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="Apply Leave" />
  </TopToolbar>
);

export const LeaveList = () => (
  <List
    filters={filters}
    actions={<LeaveActions />}
    sort={{ field: "created_at", order: "DESC" }}
    title="Leave Requests"
  >
    <DataTable>
      <DataTable.Col label="Employee">
        <ReferenceField source="employee_id" reference="employees" link={false}>
          <span />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col label="Type">
        <LeaveTypeField />
      </DataTable.Col>
      <DataTable.Col source="start_date" label="From" />
      <DataTable.Col source="end_date" label="To" />
      <DataTable.Col label="Duration">
        <DurationField />
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
