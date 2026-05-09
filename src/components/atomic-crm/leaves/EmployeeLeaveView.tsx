/**
 * EmployeeLeaveView — premium leave dashboard for non-admin employees.
 *
 * Features:
 *  • Leave balance summary (calculated from current year data)
 *  • Status filter tabs (All / Pending / Approved / Rejected)
 *  • Beautiful leave cards with colored status stripe
 *  • "Apply Leave" button (navigates to create page)
 */
import { useState } from "react";
import { useGetIdentity, useGetList, useRedirect } from "ra-core";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Plus,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { Employee, Leave } from "../types";

// ── helpers ────────────────────────────────────────────────────────────────────

const LEAVE_META: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  annual: { label: "Annual", emoji: "✈️", color: "text-indigo-600" },
  sick: { label: "Sick", emoji: "🤒", color: "text-rose-600" },
  casual: { label: "Casual", emoji: "🌴", color: "text-emerald-600" },
  other: { label: "Other", emoji: "📋", color: "text-amber-600" },
};

const STATUS_META: Record<
  string,
  {
    label: string;
    stripe: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Pending",
    stripe: "bg-amber-400",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    stripe: "bg-emerald-500",
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    stripe: "bg-rose-500",
    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: XCircle,
  },
};

const YEAR = new Date().getFullYear();
const YEAR_START = `${YEAR}-01-01`;

function leaveDays(start: string, end: string): number {
  return (
    Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / 86400000,
    ) + 1
  );
}

function fmtDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const e = new Date(end + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return start === end ? e : `${s} – ${e}`;
}

// ── Balance bar ────────────────────────────────────────────────────────────────

const LEAVE_QUOTA: Record<string, number> = {
  annual: 12,
  sick: 6,
  casual: 6,
  other: 4,
};

const BalanceStrip = ({ leaves }: { leaves: Leave[] }) => {
  const approvedThisYear = leaves.filter(
    (l) => l.status === "approved" && l.start_date >= YEAR_START,
  );

  return (
    <div className="grid grid-cols-4 gap-2 mb-2">
      {(["casual", "sick", "annual", "other"] as const).map((type) => {
        const used = approvedThisYear
          .filter((l) => l.leave_type === type)
          .reduce((acc, l) => acc + leaveDays(l.start_date, l.end_date), 0);
        const total = LEAVE_QUOTA[type];
        const remaining = Math.max(0, total - used);
        const meta = LEAVE_META[type];
        return (
          <div key={type} className="rounded-xl border bg-card p-3 text-center">
            <span className="text-xl">{meta.emoji}</span>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {meta.label}
            </p>
            <p
              className={cn(
                "text-lg font-bold tabular-nums mt-0.5",
                meta.color,
              )}
            >
              {remaining}
            </p>
            <p className="text-[10px] text-muted-foreground">of {total} left</p>
          </div>
        );
      })}
    </div>
  );
};

// ── Leave card ─────────────────────────────────────────────────────────────────

const LeaveCard = ({ leave }: { leave: Leave }) => {
  const status = STATUS_META[leave.status] ?? STATUS_META.pending;
  const leaveMeta = LEAVE_META[leave.leave_type] ?? LEAVE_META.other;
  const days = leaveDays(leave.start_date, leave.end_date);
  const StatusIcon = status.icon;

  return (
    <div className="relative flex overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Colored status stripe */}
      <div className={cn("w-1 shrink-0", status.stripe)} />

      <div className="flex flex-1 items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{leaveMeta.emoji}</span>
          <div>
            <p className="text-sm font-semibold">
              {leaveMeta.label} Leave
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                · {days} day{days !== 1 ? "s" : ""}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmtDateRange(leave.start_date, leave.end_date)}
            </p>
            {leave.reason && (
              <p className="text-xs text-muted-foreground mt-1 italic truncate max-w-[220px]">
                "{leave.reason}"
              </p>
            )}
            {leave.admin_notes && leave.status !== "pending" && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Admin: {leave.admin_notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
              status.badge,
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
          <p className="text-[10px] text-muted-foreground">
            {new Date(leave.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Status filter tabs ─────────────────────────────────────────────────────────

const TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Main ───────────────────────────────────────────────────────────────────────

export const EmployeeLeaveView = () => {
  const { identity } = useGetIdentity();
  const redirect = useRedirect();
  const [activeTab, setActiveTab] = useState<TabId>("all");

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

  const { data: leaves, isPending: leavesLoading } = useGetList<Leave>(
    "leaves",
    {
      filter: employee?.id ? { employee_id: employee.id } : {},
      pagination: { page: 1, perPage: 50 },
      sort: { field: "created_at", order: "DESC" },
    },
    { enabled: !!employee?.id, staleTime: 0 },
  );

  const filtered = !leaves
    ? []
    : activeTab === "all"
      ? leaves
      : leaves.filter((l) => l.status === activeTab);

  const counts = {
    all: leaves?.length ?? 0,
    pending: leaves?.filter((l) => l.status === "pending").length ?? 0,
    approved: leaves?.filter((l) => l.status === "approved").length ?? 0,
    rejected: leaves?.filter((l) => l.status === "rejected").length ?? 0,
  };

  if (empLoading) {
    return (
      <div className="max-w-lg mx-auto mt-4 space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-4 pb-20 space-y-4">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-orange-500" />
            My Leaves
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {employee?.name} · {YEAR}
          </p>
        </div>
        <Button
          onClick={() => redirect("/leaves/create")}
          className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white shadow-md"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Apply Leave
        </Button>
      </div>

      {/* ── Balance pills ───────────────────────────────────────────── */}
      {!leavesLoading && leaves && <BalanceStrip leaves={leaves} />}

      {/* ── Filter tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-1.5 bg-muted/60 p-1 rounded-xl">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
              activeTab === id
                ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {counts[id] > 0 && (
              <span className="ml-1 text-[10px] opacity-70">
                ({counts[id]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Leave cards ─────────────────────────────────────────────── */}
      {leavesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <CalendarClock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No leave requests yet.
          </p>
          {activeTab === "all" && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => redirect("/leaves/create")}
            >
              Apply for leave
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((leave) => (
            <LeaveCard key={leave.id} leave={leave} />
          ))}
        </div>
      )}
    </div>
  );
};
