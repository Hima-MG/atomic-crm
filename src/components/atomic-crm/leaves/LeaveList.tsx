import {
  useGetIdentity,
  useRecordContext,
  useUpdate,
  useNotify,
  useRefresh,
} from "ra-core";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X } from "lucide-react";
import { TopToolbar } from "../layout/TopToolbar";
import { LEAVE_TYPE_CHOICES, LEAVE_STATUS_CHOICES } from "./LeaveInputs";
import { EmployeeLeaveView } from "./EmployeeLeaveView";
import type { Leave } from "../types";

// ── Shared helpers ─────────────────────────────────────────────────────────────

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

// ── Admin quick-approve/reject buttons ─────────────────────────────────────────

const ApproveRejectButtons = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Leave>();
  const notify = useNotify();
  const refresh = useRefresh();
  const [update] = useUpdate();

  if (!record || record.status !== "pending") return null;

  const act = async (status: "approved" | "rejected") => {
    try {
      await update(
        "leaves",
        { id: record.id, data: { status }, previousData: record },
        { returnPromise: true },
      );
      notify(status === "approved" ? "Leave approved" : "Leave rejected", {
        type: status === "approved" ? "success" : "warning",
      });
      refresh();
    } catch {
      notify("Action failed", { type: "error" });
    }
  };

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-green-700 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
        onClick={() => act("approved")}
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-red-700 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
        onClick={() => act("rejected")}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

// ── Admin table ────────────────────────────────────────────────────────────────

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

const AdminLeaveList = () => (
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
      <DataTable.Col label="Approve">
        <ApproveRejectButtons />
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

export const LeaveList = () => {
  const { identity, isPending } = useGetIdentity();

  if (isPending) {
    return (
      <div className="max-w-lg mx-auto mt-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (identity?.administrator === true) {
    return <AdminLeaveList />;
  }

  return <EmployeeLeaveView />;
};
