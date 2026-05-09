import { useState } from "react";
import { useGetIdentity, useGetList, useRedirect } from "ra-core";
import {
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PunchCard } from "./PunchCard";
import { QuickLeaveDialog } from "./QuickLeaveDialog";
import type { Employee, Leave, DailyTask } from "../types";

const TODAY = new Date().toISOString().slice(0, 10);

const QuickAction = ({
  icon: Icon,
  label,
  description,
  onClick,
  color,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
}) => (
  <button
    onClick={onClick}
    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left w-full"
  >
    <div className={`p-2 rounded-md ${color} shrink-0`}>
      <Icon className="h-4 w-4 text-white" />
    </div>
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  </button>
);

const StatCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) => (
  <Card>
    <CardContent className="pt-4 pb-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        {label}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

export const EmployeeDashboard = () => {
  const { identity } = useGetIdentity();
  const redirect = useRedirect();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const { data: employees } = useGetList<Employee>(
    "employees",
    {
      filter: {},
      pagination: { page: 1, perPage: 1 },
      sort: { field: "created_at", order: "DESC" },
    },
    { staleTime: 5 * 60 * 1000 },
  );

  const employee = employees?.[0];

  const { total: pendingLeavesTotal } = useGetList<Leave>(
    "leaves",
    {
      filter: employee?.id
        ? { employee_id: employee.id, status: "pending" }
        : {},
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: !!employee?.id },
  );

  const { data: todayTasks, total: todayTasksTotal } = useGetList<DailyTask>(
    "daily_tasks",
    {
      filter: employee?.id
        ? { employee_id: employee.id, submission_date: TODAY }
        : {},
      pagination: { page: 1, perPage: 100 },
    },
    { enabled: !!employee?.id },
  );

  const pendingTasksCount =
    todayTasks?.filter((t) => t.status === "pending").length ?? 0;

  const firstName = identity?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-5">
        <p className="text-sm font-medium opacity-80">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-bold mt-1">Hello, {firstName} 👋</h1>
        <p className="text-sm opacity-75 mt-0.5">
          {employee?.department ?? "Welcome to your workspace"}
        </p>
      </div>

      {/* Punch in/out */}
      {employee && <PunchCard employeeId={employee.id} />}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Pending Leaves"
          value={pendingLeavesTotal ?? 0}
          sub="awaiting approval"
        />
        <StatCard
          label="Tasks Today"
          value={todayTasksTotal ?? 0}
          sub={`${pendingTasksCount} pending`}
        />
        <StatCard
          label="Department"
          value={employee?.department ? employee.department.split(" ")[0] : "—"}
          sub={employee?.role ?? undefined}
        />
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickAction
            icon={CalendarClock}
            label="Apply for Leave"
            description="Submit a leave request"
            color="bg-orange-500"
            onClick={() => setLeaveDialogOpen(true)}
          />
          <QuickAction
            icon={ClipboardList}
            label="Submit Daily Task"
            description="Log your work for today"
            color="bg-blue-600"
            onClick={() => redirect("/daily_tasks/create")}
          />
          <QuickAction
            icon={CalendarCheck}
            label="View Attendance"
            description="Check your attendance history"
            color="bg-green-600"
            onClick={() => redirect("/attendance")}
          />
          <QuickAction
            icon={User}
            label="My Profile"
            description="View and update your profile"
            color="bg-purple-600"
            onClick={() => redirect("/profile")}
          />
        </div>
      </div>

      {/* Today's tasks preview */}
      {(todayTasks?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Today's Tasks
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={() => redirect("/daily_tasks")}
            >
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {todayTasks?.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm"
              >
                <span className="font-medium truncate max-w-[70%]">
                  {task.task_title}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : task.status === "under-review"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                  }`}
                >
                  {task.status === "under-review" ? "Review" : task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <QuickLeaveDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        employeeId={employee?.id}
      />
    </div>
  );
};
