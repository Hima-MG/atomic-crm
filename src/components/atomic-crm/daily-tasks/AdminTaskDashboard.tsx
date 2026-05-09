/**
 * AdminTaskDashboard — modern task review workspace for admins.
 *
 * Shows all employees' task submissions for a given date.
 *
 * Features:
 *  • Date navigator
 *  • 4 summary stats (Employees reporting / Tasks / Hours / Done %)
 *  • Task cards with employee name + avatar, category pill, status badge
 *  • Admin can update task status inline (Pending → Under Review → Completed)
 */
import { useMemo, useState } from "react";
import { useGetList, useNotify, useUpdate } from "ra-core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  Plus,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import type { DailyTask, Employee } from "../types";

// ── helpers ────────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string): string {
  if (iso === TODAY) return "Today";
  const yesterday = addDays(TODAY, -1);
  if (iso === yesterday) return "Yesterday";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const DEPT_COLORS: Record<string, string> = {
  Management: "bg-purple-500",
  HR: "bg-rose-500",
  "IT Team": "bg-blue-500",
  "Digital Marketing Team": "bg-cyan-500",
  "Content Creator Team": "bg-amber-500",
  Accounts: "bg-teal-500",
};
function deptColor(dept?: string): string {
  return DEPT_COLORS[dept ?? ""] ?? "bg-slate-500";
}

const CATEGORY_COLORS: Record<string, string> = {
  "Content Creation":
    "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  "Video/Reel Preparation":
    "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  "Website & App Management":
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  "Student Support":
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  "Admissions & Enrollments":
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  "Social Media":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  "Admin & Accounts":
    "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
  "Meetings/Sessions":
    "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  "Research & Learning":
    "bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-300",
  Miscellaneous:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    Icon: AlertCircle,
    next: "under-review" as const,
    nextLabel: "Mark In Review",
  },
  "under-review": {
    label: "In Review",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    Icon: Eye,
    next: "completed" as const,
    nextLabel: "Mark Complete",
  },
  completed: {
    label: "Done",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    Icon: CheckCircle2,
    next: null,
    nextLabel: "",
  },
};

// ── Stat card ──────────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  gradient,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  gradient: string;
  icon: React.ElementType;
}) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl p-4 text-white shadow-md",
      gradient,
    )}
  >
    <div className="absolute -top-3 -right-3 h-14 w-14 rounded-full bg-white/10" />
    <div className="relative">
      <Icon className="h-4 w-4 text-white/70 mb-2" />
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-white/80 text-xs font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

// ── Task card ──────────────────────────────────────────────────────────────────

const TaskCard = ({
  task,
  employee,
  onStatusChange,
}: {
  task: DailyTask;
  employee?: Employee;
  onStatusChange: (task: DailyTask, next: "under-review" | "completed") => void;
}) => {
  const statusCfg =
    STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.Icon;
  const catCls =
    CATEGORY_COLORS[task.category] ??
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <div className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow p-4 space-y-3">
      {/* Top row: category + status */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-0.5 rounded-full truncate max-w-[60%]",
            catCls,
          )}
        >
          {task.category}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
            statusCfg.cls,
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {statusCfg.label}
        </span>
      </div>

      {/* Employee avatar + name */}
      {employee && (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0",
              deptColor(employee.department),
            )}
          >
            {getInitials(employee.name)}
          </div>
          <div>
            <p className="text-xs font-semibold leading-none">
              {employee.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {employee.department}
            </p>
          </div>
        </div>
      )}

      {/* Task title */}
      <p className="text-sm font-semibold leading-snug">{task.task_title}</p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Time + hours */}
      {(task.start_time || task.total_time != null) && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.start_time && task.end_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.start_time.slice(0, 5)} – {task.end_time.slice(0, 5)}
            </span>
          )}
          {task.total_time != null && (
            <span className="font-semibold text-foreground">
              {task.total_time}h
            </span>
          )}
        </div>
      )}

      {/* Admin action button */}
      {statusCfg.next && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs gap-1.5"
          onClick={() =>
            statusCfg.next && onStatusChange(task, statusCfg.next)
          }
        >
          {statusCfg.next === "completed" ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Eye className="h-3.5 w-3.5 text-blue-600" />
          )}
          {statusCfg.nextLabel}
        </Button>
      )}
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────

export const AdminTaskDashboard = () => {
  const notify = useNotify();
  const [update] = useUpdate();
  const [date, setDate] = useState(TODAY);

  const { data: tasks, isPending: tasksLoading, refetch } = useGetList<DailyTask>(
    "daily_tasks",
    {
      filter: { submission_date: date },
      pagination: { page: 1, perPage: 500 },
      sort: { field: "employee_id", order: "ASC" },
    },
    { staleTime: 0 },
  );

  const { data: employees } = useGetList<Employee>(
    "employees",
    {
      pagination: { page: 1, perPage: 200 },
      sort: { field: "name", order: "ASC" },
      filter: {},
    },
    { staleTime: 5 * 60 * 1000 },
  );

  const empMap = useMemo(
    () =>
      Object.fromEntries((employees ?? []).map((e) => [String(e.id), e])),
    [employees],
  );

  // Stats
  const totalTasks = tasks?.length ?? 0;
  const totalHours = (tasks ?? []).reduce(
    (acc, t) => acc + (t.total_time ?? 0),
    0,
  );
  const completedCount = (tasks ?? []).filter(
    (t) => t.status === "completed",
  ).length;
  const uniqueEmployees = new Set(
    (tasks ?? []).map((t) => String(t.employee_id)),
  ).size;
  const donePercent =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const handleStatusChange = async (
    task: DailyTask,
    next: "under-review" | "completed",
  ) => {
    try {
      await update(
        "daily_tasks",
        { id: task.id, data: { status: next }, previousData: task },
        { returnPromise: true },
      );
      notify(
        next === "completed" ? "Marked as complete ✓" : "Moved to review",
        { type: "success" },
      );
      refetch();
    } catch {
      notify("Update failed", { type: "error" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-4 pb-10 space-y-5">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Work Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily task submissions from all employees
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date navigator */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-2 py-1.5">
            <button
              onClick={() => setDate((d) => addDays(d, -1))}
              className="p-1 rounded-lg hover:bg-background transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold min-w-[130px] text-center">
              {fmtDate(date)}
            </span>
            <button
              onClick={() => setDate((d) => addDays(d, 1))}
              disabled={date >= TODAY}
              className="p-1 rounded-lg hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/daily_tasks/create">
              <Plus className="h-4 w-4" />
              Add Task
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      {tasksLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Reporting"
            value={uniqueEmployees}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            icon={Users}
          />
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            gradient="bg-gradient-to-br from-purple-500 to-violet-600"
            icon={ClipboardList}
          />
          <StatCard
            label="Hours Logged"
            value={totalHours > 0 ? `${totalHours}h` : "—"}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            icon={Clock}
          />
          <StatCard
            label="Completed"
            value={`${donePercent}%`}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            icon={CheckCircle2}
          />
        </div>
      )}

      {/* ── Task cards grid ──────────────────────────────────────────── */}
      {tasksLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : totalTasks === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm font-semibold text-muted-foreground">
            No task reports for {fmtDate(date).toLowerCase()}
          </p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>
                {completedCount} of {totalTasks} tasks completed
              </span>
              <span>{donePercent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${donePercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasks?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                employee={empMap[String(task.employee_id)]}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
