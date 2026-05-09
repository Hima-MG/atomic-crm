/**
 * AdminLeaveDashboard — modern leave management view for admins.
 *
 * Shows:
 *  • 4 stat chips (Total / Pending / Approved / Rejected)
 *  • Status filter tabs
 *  • Leave request cards with employee name, type, dates, reason
 *  • Inline Approve / Reject buttons for pending requests
 */
import { useMemo, useState } from "react";
import { useGetList, useNotify, useUpdate } from "ra-core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Plus,
  X,
  XCircle,
} from "lucide-react";
import { Link } from "react-router";
import type { Employee, Leave } from "../types";

// ── helpers ────────────────────────────────────────────────────────────────────

const LEAVE_META: Record<string, { label: string; emoji: string }> = {
  annual: { label: "Annual", emoji: "✈️" },
  sick: { label: "Sick", emoji: "🤒" },
  casual: { label: "Casual", emoji: "🌴" },
  other: { label: "Other", emoji: "📋" },
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

// ── Stat chip ──────────────────────────────────────────────────────────────────

const StatChip = ({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 rounded-2xl p-4 text-center border transition-all",
      active
        ? "ring-2 ring-offset-1 ring-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
        : "bg-card hover:bg-muted/50",
    )}
  >
    <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
    <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
  </button>
);

// ── Leave card ─────────────────────────────────────────────────────────────────

const LeaveCard = ({
  leave,
  employeeName,
  employeeDept,
  onAct,
}: {
  leave: Leave;
  employeeName: string;
  employeeDept?: string;
  onAct: (id: Leave["id"], status: "approved" | "rejected") => void;
}) => {
  const status = STATUS_META[leave.status] ?? STATUS_META.pending;
  const leaveMeta = LEAVE_META[leave.leave_type] ?? LEAVE_META.other;
  const days = leaveDays(leave.start_date, leave.end_date);
  const StatusIcon = status.icon;

  return (
    <div className="relative flex overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Status stripe */}
      <div className={cn("w-1.5 shrink-0", status.stripe)} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Top row: employee + status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0",
                deptColor(employeeDept),
              )}
            >
              {getInitials(employeeName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{employeeName}</p>
              <p className="text-xs text-muted-foreground">{employeeDept}</p>
            </div>
          </div>
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0",
              status.badge,
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
        </div>

        {/* Leave details */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xl">{leaveMeta.emoji}</span>
          <div>
            <p className="text-sm font-semibold">
              {leaveMeta.label} Leave
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                · {days} day{days !== 1 ? "s" : ""}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {fmtDateRange(leave.start_date, leave.end_date)}
            </p>
          </div>
        </div>

        {/* Reason */}
        {leave.reason && (
          <p className="text-xs text-muted-foreground italic bg-muted/50 rounded-lg px-3 py-2 leading-relaxed">
            "{leave.reason}"
          </p>
        )}

        {/* Admin notes */}
        {leave.admin_notes && (
          <p className="text-xs text-blue-600 dark:text-blue-400">
            📝 {leave.admin_notes}
          </p>
        )}

        {/* Approve / Reject */}
        {leave.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white h-8"
              onClick={() => onAct(leave.id, "approved")}
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950 h-8"
              onClick={() => onAct(leave.id, "rejected")}
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        )}

        {/* Applied on */}
        <p className="text-[10px] text-muted-foreground text-right">
          Applied{" "}
          {new Date(leave.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
};

// ── Filter tabs ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Main ───────────────────────────────────────────────────────────────────────

export const AdminLeaveDashboard = () => {
  const notify = useNotify();
  const [update] = useUpdate();
  const [activeTab, setActiveTab] = useState<TabId>("pending");

  // Fetch all leave requests (no filter — show all employees)
  const { data: leaves, isPending: leavesLoading, refetch } = useGetList<Leave>(
    "leaves",
    {
      pagination: { page: 1, perPage: 200 },
      sort: { field: "created_at", order: "DESC" },
      filter: {},
    },
    { staleTime: 0 },
  );

  // Fetch employees for name lookup
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
      Object.fromEntries(
        (employees ?? []).map((e) => [String(e.id), e]),
      ),
    [employees],
  );

  const counts = useMemo(
    () => ({
      all: leaves?.length ?? 0,
      pending: (leaves ?? []).filter((l) => l.status === "pending").length,
      approved: (leaves ?? []).filter((l) => l.status === "approved").length,
      rejected: (leaves ?? []).filter((l) => l.status === "rejected").length,
    }),
    [leaves],
  );

  const filtered = useMemo(
    () =>
      !leaves
        ? []
        : activeTab === "all"
          ? leaves
          : leaves.filter((l) => l.status === activeTab),
    [leaves, activeTab],
  );

  const handleAct = async (
    id: Leave["id"],
    status: "approved" | "rejected",
  ) => {
    const leave = leaves?.find((l) => l.id === id);
    if (!leave) return;
    try {
      await update(
        "leaves",
        { id, data: { status }, previousData: leave },
        { returnPromise: true },
      );
      notify(status === "approved" ? "Leave approved ✓" : "Leave rejected", {
        type: status === "approved" ? "success" : "warning",
      });
      refetch();
    } catch {
      notify("Action failed", { type: "error" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-4 pb-10 space-y-5">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-orange-500" />
            Leave Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            All employee leave requests
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white">
          <Link to="/leaves/create">
            <Plus className="h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {/* ── Stat chips ──────────────────────────────────────────────── */}
      {leavesLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          <StatChip
            label="Total"
            value={counts.all}
            color="text-foreground"
            active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          />
          <StatChip
            label="Pending"
            value={counts.pending}
            color="text-amber-600 dark:text-amber-400"
            active={activeTab === "pending"}
            onClick={() => setActiveTab("pending")}
          />
          <StatChip
            label="Approved"
            value={counts.approved}
            color="text-emerald-600 dark:text-emerald-400"
            active={activeTab === "approved"}
            onClick={() => setActiveTab("approved")}
          />
          <StatChip
            label="Rejected"
            value={counts.rejected}
            color="text-rose-600 dark:text-rose-400"
            active={activeTab === "rejected"}
            onClick={() => setActiveTab("rejected")}
          />
        </div>
      )}

      {/* ── Filter tab bar ───────────────────────────────────────────── */}
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
              <span className="ml-1 opacity-60">({counts[id]})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Leave cards ─────────────────────────────────────────────── */}
      {leavesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14">
          <CalendarClock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No {activeTab === "all" ? "" : activeTab} leave requests.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((leave) => {
            const emp = empMap[String(leave.employee_id)];
            return (
              <LeaveCard
                key={leave.id}
                leave={leave}
                employeeName={emp?.name ?? `Employee #${leave.employee_id}`}
                employeeDept={emp?.department}
                onAct={handleAct}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
