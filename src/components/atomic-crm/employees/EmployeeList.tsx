import { useRecordContext } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";
import { EditButton } from "@/components/admin/edit-button";
import { ShowButton } from "@/components/admin/show-button";
import { Badge } from "@/components/ui/badge";
import { TopToolbar } from "../layout/TopToolbar";
import { DEPARTMENT_CHOICES, STATUS_CHOICES } from "./EmployeeInputs";
import type { Employee } from "../types";

const filters = [
  <SearchInput source="q" alwaysOn />,
  <SelectInput
    source="department"
    label="Department"
    choices={DEPARTMENT_CHOICES}
    emptyText="All Departments"
    alwaysOn
  />,
  <SelectInput
    source="status"
    label="Status"
    choices={STATUS_CHOICES}
    emptyText="All"
  />,
];

const EmployeeActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="Add Employee" />
  </TopToolbar>
);

const StatusBadge = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Employee>();
  if (!record) return null;
  return (
    <Badge
      className={
        record.status === "active"
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0"
      }
    >
      {record.status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
};

const SalaryField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext<Employee>();
  if (!record?.salary) return <span className="text-muted-foreground">—</span>;
  return <span>₹{record.salary.toLocaleString("en-IN")}</span>;
};

export const EmployeeList = () => (
  <List
    filters={filters}
    actions={<EmployeeActions />}
    sort={{ field: "name", order: "ASC" }}
    title="Employees"
  >
    <DataTable>
      <DataTable.Col source="name" />
      <DataTable.Col source="department" />
      <DataTable.Col source="role" />
      <DataTable.Col source="phone" />
      <DataTable.Col source="email" />
      <DataTable.Col label="Salary">
        <SalaryField />
      </DataTable.Col>
      <DataTable.Col label="Status">
        <StatusBadge />
      </DataTable.Col>
      <DataTable.Col label={false}>
        <div className="flex gap-1">
          <ShowButton />
          <EditButton />
        </div>
      </DataTable.Col>
    </DataTable>
  </List>
);
