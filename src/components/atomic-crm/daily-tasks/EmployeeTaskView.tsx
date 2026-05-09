/**
 * EmployeeTaskView — premium task workspace for non-admin employees.
 *
 * Features:
 *  • Date selector with prev/next navigation
 *  • Daily summary (total tasks, total hours logged)
 *  • Task cards: category pill, title, time range, status badge
 *  • Floating "Log Task" button
 *  • Empty state with motivational copy
 */
import { useState } from "react";
import { useGetIdentity, useGetList, useRedirect } from "ra-core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import type { DailyTask, Employee } from "../types";

// ── helpers ────────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const todayStr = TODAY;
  if (iso === todayStr) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const CATEGORY_COLORS: Record<string, string> = {
  "Content Creation":
    "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  "Video/Reel Preparation":
    "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  "Website & App Management":
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  "Student Support":
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "Admissions & Enrollments":
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  "Social Media":
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "Admin & Accounts":
    "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  "Meetings/Sessions":
    "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  "Research & Learning":
    "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300",
  Miscellaneous:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    Icon: AlertCircle,
  },
  "under-review": {
    label: "In Review",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    Icon: Eye,
  },
  completed: {
    label: "Done",
    cls: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    Icon: CheckCircle2,
  },
};

// ── Task card ──────────────────────────────────────────────────────────────────

const TaskCard = ({ task }: { task: DailyTask }) => {
  const statusCfg =
    STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.Icon;
  const catCls =
    CATEGORY_COLORS[task.category] ??
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow p-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-0.5 rounded-full",
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

      {/* Title */}
      <p className="text-sm font-semibold leading-snug mb-1">
        {task.task_title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
        {task.start_time && task.end_time && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.start_time.slice(0, 5)} – {task.end_time.slice(0, 5)}
          </span>
        )}
        {task.total_time != null && (
          <span className="font-medium text-foreground">
            {task.total_time}h
          </span>
        )}
        {task.admin_notes && (
          <span className="text-blue-600 dark:text-blue-400 italic truncate max-w-[180px]">
            Admin: {task.admin_notes}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────

export const EmployeeTaskView = () => {
  const { identity } = useGetIdentity();
  const redirect = useRedirect();
  const [date, setDate] = useState(TODAY);

  const { data: employees, isPending: empLoading } = useGetList<Employee>(
    "employees",
    {
      filter: { email: identity?.email },
      pagination: { page: 1, perPage: 1 },
      sort: { field: "id", order: "ASC" },
    },
    { enabled: !!identity?.email },
  );
  const employee = employees?.[0];

  const { data: tasks, isPending: tasksLoading } = useGetList<DailyTask>(
    "daily_tasks",
    {
      filter: employee?.id
        ? { employee_id: employee.id, submission_date: date }
        : {},
      pagination: { page: 1, perPage: 50 },
      sort: { field: "created_at", order: "ASC" },
    },
    { enabled: !!employee?.id, staleTime: 0 },
  );

  const totalHours = (tasks ?? []).reduce(
    (acc, t) => acc + (t.total_time ?? 0),
    0,
  );
  const completedCount = (tasks ?? []).filter(
    (t) => t.status === "completed",
  ).length;
  const isFuture = date > TODAY;

  if (empLoading) {
    return (
      <div className="max-w-lg mx-auto mt-4 space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-4 pb-24 space-y-4">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Work Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {employee?.name} · {employee?.department}
          </p>
        </div>
      </div>

      {/* ── Date navigator ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-2">
        <button
          onClick={() => setDate((d) => addDays(d, -1))}
          className="p-1.5 rounded-lg hover:bg-background transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold">{fmtDate(date)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{date}</p>
        </div>
        <button
          onClick={() => setDate((d) => addDays(d, 1))}
          disabled={date >= TODAY}
          className="p-1.5 rounded-lg hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Daily summary strip ─────────────────────────────────────── */}
      {!tasksLoading && (tasks?.length ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">Tasks</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300 tabular-nums">
              {tasks?.length ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">Hours</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
              {totalHours > 0 ? `${totalHours}h` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-100 dark:border-purple-900 p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">Done</p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300 tabular-nums">
              {completedCount}/{tasks?.length ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* ── Task cards ──────────────────────────────────────────────── */}
      {tasksLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : isFuture ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-sm font-semibold">Future date</p>
          <p className="text-xs text-muted-foreground mt-1">
            Navigate back to log your work
          </p>
        </div>
      ) : (tasks?.length ?? 0) === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">✨</p>
          <p className="text-sm font-semibold">
            {date === TODAY
              ? "No tasks logged yet today"
              : "No tasks for this day"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {date === TODAY
              ? "Log what you worked on to track your progress"
              : "Nothing was logged for this date"}
          </p>
          {date === TODAY && (
            <Button
              size="sm"
              onClick={() => redirect("/daily_tasks/create")}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Log First Task
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks?.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* ── Floating action button ───────────────────────────────────── */}
      {date === TODAY && (
        <button
          onClick={() => redirect("/daily_tasks/create")}
          className={cn(
            "fixed bottom-6 right-6 z-40",
            "flex items-center gap-2 px-5 py-3 rounded-full",
            "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm",
            "shadow-lg shadow-blue-300 dark:shadow-blue-900",
            "hover:scale-105 active:scale-95 transition-transform",
          )}
        >
          <Plus className="h-4 w-4" />
          Log Task
        </button>
      )}
    </div>
  );
};
