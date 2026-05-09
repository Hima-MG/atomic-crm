import { useGetIdentity, useRecordContext } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SelectInput } from "@/components/admin/select-input";
import { DateInput } from "@/components/admin/date-input";
import { EditButton } from "@/components/admin/edit-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { ReferenceField } from "@/components/admin/reference-field";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TopToolbar } from "../layout/TopToolbar";
import { TASK_CATEGORY_CHOICES, TASK_STATUS_CHOICES } from "./DailyTaskInputs";
import { EmployeeTaskView } from "./EmployeeTaskView";
import type { DailyTask } from "../types";

// ── Admin table helpers ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0",
  "under-review":
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0",
};

const StatusBadge = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<DailyTask>();
  if (!record) return null;
  const label =
    TASK_STATUS_CHOICES.find((c) => c.id === record.status)?.name ??
    record.status;
  return <Badge className={STATUS_COLORS[record.status] ?? ""}>{label}</Badge>;
};

const TruncatedField = ({
  source,
  maxLen = 50,
}: {
  source: keyof DailyTask;
  label?: string | boolean;
  maxLen?: number;
}) => {
  const record = useRecordContext<DailyTask>();
  if (!record) return null;
  const value = record[source] as string | undefined;
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span title={value}>
      {value.length > maxLen ? value.slice(0, maxLen) + "…" : value}
    </span>
  );
};

const TotalTimeField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<DailyTask>();
  if (!record) return null;
  if (!record.total_time)
    return <span className="text-muted-foreground">—</span>;
  return <span className="font-medium">{record.total_time}h</span>;
};

const TimeField = ({
  source,
}: {
  source: "start_time" | "end_time";
  label?: string | boolean;
}) => {
  const record = useRecordContext<DailyTask>();
  if (!record) return null;
  const value = record[source] as string | undefined;
  if (!value) return <span className="text-muted-foreground">—</span>;
  return <span className="font-mono text-sm">{value.slice(0, 5)}</span>;
};

const TODAY = new Date().toISOString().slice(0, 10);

const filters = [
  <SearchInput source="q" alwaysOn />,
  <SelectInput
    source="category"
    label="Category"
    choices={TASK_CATEGORY_CHOICES}
    emptyText="All Categories"
    alwaysOn
  />,
  <DateInput source="submission_date" label="Date" alwaysOn />,
  <SelectInput
    source="status"
    label="Status"
    choices={TASK_STATUS_CHOICES}
    emptyText="All"
  />,
  <ReferenceInput source="employee_id" reference="employees">
    <AutocompleteInput
      label="Employee"
      optionText="name"
      placeholder="All Employees"
    />
  </ReferenceInput>,
];

const DailyTaskActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="Add Task" />
  </TopToolbar>
);

const AdminDailyTaskList = () => (
  <List
    filters={filters}
    filterDefaultValues={{ submission_date: TODAY }}
    actions={<DailyTaskActions />}
    sort={{ field: "submission_date", order: "DESC" }}
    title="Daily Task Log"
  >
    <DataTable>
      <DataTable.Col source="submission_date" label="Date" />
      <DataTable.Col label="Employee">
        <ReferenceField source="employee_id" reference="employees" link={false}>
          <span />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="category" label="Category" />
      <DataTable.Col label="Task">
        <TruncatedField source="task_title" />
      </DataTable.Col>
      <DataTable.Col label="Start">
        <TimeField source="start_time" />
      </DataTable.Col>
      <DataTable.Col label="End">
        <TimeField source="end_time" />
      </DataTable.Col>
      <DataTable.Col label="Hours">
        <TotalTimeField />
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

// ── Role-aware entry point ─────────────────────────────────────────────────────

export const DailyTaskList = () => {
  const { identity, isPending } = useGetIdentity();

  if (isPending) {
    return (
      <div className="max-w-lg mx-auto mt-4 space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (identity?.administrator === true) {
    return <AdminDailyTaskList />;
  }

  return <EmployeeTaskView />;
};
