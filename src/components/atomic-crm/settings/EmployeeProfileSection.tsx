import { useGetList } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Employee, Attendance, Leave } from "../types";

const MONTH_START = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10);

const YEAR_START = `${new Date().getFullYear()}-01-01`;

const Field = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div>
    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
      {label}
    </p>
    <p className="text-sm font-medium">{value ?? "—"}</p>
  </div>
);

const StatPill = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className={`rounded-lg px-3 py-2 text-center ${color}`}>
    <p className="text-lg font-bold">{value}</p>
    <p className="text-xs opacity-80">{label}</p>
  </div>
);

export const EmployeeProfileSection = () => {
  const { data: employees, isPending: empPending } = useGetList<Employee>(
    "employees",
    {
      filter: {},
      pagination: { page: 1, perPage: 1 },
      sort: { field: "created_at", order: "DESC" },
    },
    { staleTime: 5 * 60 * 1000 },
  );

  const employee = employees?.[0];

  // ── This month attendance ──────────────────────────────────────────────────
  const { total: presentDays } = useGetList<Attendance>(
    "attendance",
    {
      filter: employee?.id
        ? {
            employee_id: employee.id,
            status: "present",
            "date@gte": MONTH_START,
          }
        : {},
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: !!employee?.id },
  );

  const { total: absentDays } = useGetList<Attendance>(
    "attendance",
    {
      filter: employee?.id
        ? {
            employee_id: employee.id,
            status: "absent",
            "date@gte": MONTH_START,
          }
        : {},
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: !!employee?.id },
  );

  const { total: leaveDays } = useGetList<Attendance>(
    "attendance",
    {
      filter: employee?.id
        ? {
            employee_id: employee.id,
            status: "leave",
            "date@gte": MONTH_START,
          }
        : {},
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: !!employee?.id },
  );

  // ── This year leave usage ──────────────────────────────────────────────────
  const { total: approvedLeaves } = useGetList<Leave>(
    "leaves",
    {
      filter: employee?.id
        ? {
            employee_id: employee.id,
            status: "approved",
            "start_date@gte": YEAR_START,
          }
        : {},
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: !!employee?.id },
  );

  const { total: pendingLeaves } = useGetList<Leave>(
    "leaves",
    {
      filter: employee?.id
        ? { employee_id: employee.id, status: "pending" }
        : {},
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: !!employee?.id },
  );

  if (empPending) {
    return (
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!employee) return null;

  return (
    <>
      {/* Employee details card */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <h2 className="text-base font-semibold">Employee Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Department" value={employee.department} />
            <Field label="Role" value={employee.role} />
            <Field label="Phone" value={employee.phone} />
            <Field
              label="Joining Date"
              value={
                employee.joining_date
                  ? new Date(employee.joining_date).toLocaleDateString("en-IN")
                  : undefined
              }
            />
            <Field label="Status" value={employee.status} />
          </div>
        </CardContent>
      </Card>

      {/* Attendance this month */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <h2 className="text-base font-semibold">
            Attendance —{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <StatPill
              label="Present"
              value={presentDays ?? 0}
              color="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            />
            <StatPill
              label="Absent"
              value={absentDays ?? 0}
              color="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            />
            <StatPill
              label="On Leave"
              value={leaveDays ?? 0}
              color="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Leave balance this year */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <h2 className="text-base font-semibold">
            Leave Balance — {new Date().getFullYear()}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <StatPill
              label="Approved"
              value={approvedLeaves ?? 0}
              color="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            />
            <StatPill
              label="Pending"
              value={pendingLeaves ?? 0}
              color="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};
