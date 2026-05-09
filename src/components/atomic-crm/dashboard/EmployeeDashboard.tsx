import { useState } from "react";
import { useGetIdentity, useGetList, useRedirect } from "ra-core";
import {
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  User,
  TrendingUp,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PunchCard } from "./PunchCard";
import { QuickLeaveDialog } from "./QuickLeaveDialog";
import type { Employee, Leave, DailyTask } from "../types";

const TODAY = new Date().toISOString().slice(0, 10);

// ── Stat card with gradient accent ────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
  gradient,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
  icon: React.ElementType;
}) => (
  <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
    {/* Gradient blob */}
    <div
      className={cn(
        "absolute -top-4 -right-4 h-16 w-16 rounded-full opacity-15 blur-xl",
        gradient,
      )}
    />
    <div className="relative p-4">
      <div className={cn("inline-flex p-2 rounded-xl mb-2", gradient)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground mt-0.5">
        {label}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Quick action card ──────────────────────────────────────────────────────────

const QuickAction = ({
  icon: Icon,
  label,
  description,
  onClick,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  gradient: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "group flex items-center gap-3 p-4 rounded-2xl border bg-card",
      "hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] text-left w-full",
    )}
  >
    <div className={cn("p-2.5 rounded-xl shrink-0", gradient)}>
      <Icon className="h-4 w-4 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold leading-tight">{label}</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5">
        {description}
      </p>
    </div>
  </button>
);

// ── Task preview pill ─────────────────────────────────────────────────────────

const STATUS_PILL: Record<
  string,
  { cls: string; label: string }
> = {
  pending: {
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    label: "Pending",
  },
  "under-review": {
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    label: "Review",
  },
  completed: {
    cls: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    label: "Done",
  },
};

// ── Main dashboard ────────────────────────────────────────────────────────────

export const EmployeeDashboard = () => {
  const { identity } = useGetIdentity();
  const redirect = useRedirect();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  // Resolve employee record
  const { data: employees, isPending: empLoading } = useGetList<Employee>(
    "employees",
    {
      filter: {},
      pagination: { page: 1, perPage: 1 },
      sort: { field: "created_at", order: "DESC" },
    },
    { staleTime: 5 * 60 * 1000 },
  );
  const employee = employees?.[0];

  // Pending leaves
  const { total: pendingLeavesTotal } = useGetList<Leave>(
    "leaves",
    {
      filter: employee?.id
        ? { employee_id: employee.id, status: "pending" }
        : {},
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: !!employee?.id, staleTime: 60_000 },
  );

  // Today's tasks
  const { data: todayTasks, total: todayTasksTotal } = useGetList<DailyTask>(
    "daily_tasks",
    {
      filter: employee?.id
        ? { employee_id: employee.id, submission_date: TODAY }
        : {},
      pagination: { page: 1, perPage: 100 },
    },
    { enabled: !!employee?.id, staleTime: 30_000 },
  );

  const completedToday =
    todayTasks?.filter((t) => t.status === "completed").length ?? 0;
  const totalHoursToday = (todayTasks ?? []).reduce(
    (acc, t) => acc + (t.total_time ?? 0),
    0,
  );

  const firstName = identity?.fullName?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (empLoading) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-5 pb-20">
      {/* ── Hero welcome banner ───────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white px-6 py-6 shadow-lg">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -right-2 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative">
          <p className="text-white/70 text-sm font-medium">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-2xl font-bold mt-1">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-white/70 text-sm mt-1">
            {employee?.department ?? "Welcome to your workspace"}
            {employee?.role ? ` · ${employee.role}` : ""}
          </p>
        </div>
      </div>

      {/* ── Punch card ────────────────────────────────────────────── */}
      {employee && <PunchCard employeeId={employee.id} />}

      {/* ── Stats row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Tasks Today"
          value={todayTasksTotal ?? 0}
          sub={`${completedToday} done`}
          gradient="bg-blue-500"
          icon={ClipboardList}
        />
        <StatCard
          label="Hours Logged"
          value={totalHoursToday > 0 ? `${totalHoursToday}h` : "—"}
          sub="today"
          gradient="bg-emerald-500"
          icon={Clock}
        />
        <StatCard
          label="Pending Leaves"
          value={pendingLeavesTotal ?? 0}
          sub="awaiting approval"
          gradient="bg-orange-500"
          icon={CalendarClock}
        />
      </div>

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Quick Actions
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickAction
            icon={CalendarClock}
            label="Apply for Leave"
            description="Submit a leave request instantly"
            gradient="bg-gradient-to-br from-orange-400 to-rose-500"
            onClick={() => setLeaveDialogOpen(true)}
          />
          <QuickAction
            icon={ClipboardList}
            label="Log Today's Work"
            description="Record tasks you worked on"
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            onClick={() => redirect("/daily_tasks/create")}
          />
          <QuickAction
            icon={CalendarCheck}
            label="Attendance History"
            description="View your check-in/out records"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            onClick={() => redirect("/attendance")}
          />
          <QuickAction
            icon={User}
            label="My Profile"
            description="View and update your details"
            gradient="bg-gradient-to-br from-purple-500 to-violet-600"
            onClick={() => redirect("/profile")}
          />
        </div>
      </div>

      {/* ── Today's tasks preview ─────────────────────────────────── */}
      {(todayTasks?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Today's Progress
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2"
              onClick={() => redirect("/daily_tasks")}
            >
              View All →
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>
                {completedToday} of {todayTasks?.length} completed
              </span>
              <span>
                {todayTasks?.length
                  ? Math.round((completedToday / todayTasks.length) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{
                  width: `${todayTasks?.length ? (completedToday / todayTasks.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {todayTasks?.slice(0, 4).map((task) => {
              const pill =
                STATUS_PILL[task.status as keyof typeof STATUS_PILL] ??
                STATUS_PILL.pending;
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">
                      {task.task_title}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2",
                      pill.cls,
                    )}
                  >
                    {pill.label}
                  </span>
                </div>
              );
            })}
            {(todayTasks?.length ?? 0) > 4 && (
              <p className="text-xs text-center text-muted-foreground py-1">
                +{(todayTasks?.length ?? 0) - 4} more tasks
              </p>
            )}
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
