import { useGetList, useUpdate, useNotify, useRefresh } from "ra-core";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  CalendarClock,
  Check,
  X,
} from "lucide-react";
import type { Leave } from "../types";

// Fixed date computed once at module level — not recalculated on each render
const TODAY = new Date().toISOString().slice(0, 10);

// All useGetList calls fire in parallel. staleTime=5min prevents
// re-fetching on every dashboard visit within the same session.
const LIST_OPTIONS = {
  pagination: { page: 1, perPage: 1 },
  sort: { field: "id", order: "ASC" as const },
};
const STALE = { staleTime: 5 * 60 * 1000 };

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  to,
  sub,
  loading,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  to?: string;
  sub?: string;
  loading?: boolean;
}) => {
  const inner = (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <p className="text-3xl font-bold">{value}</p>
        )}
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
  return to ? (
    <Link to={to} className="no-underline">
      {inner}
    </Link>
  ) : (
    inner
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mt-8 mb-3">
    {title}
  </h2>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const HRDashboard = () => {
  // ── Employee counts ──────────────────────────────────────────────────────
  const { total: totalAllEmployees, isPending: empLoading } = useGetList(
    "employees",
    { ...LIST_OPTIONS, filter: {} },
    STALE,
  );
  const { total: activeEmployees } = useGetList(
    "employees",
    { ...LIST_OPTIONS, filter: { status: "active" } },
    STALE,
  );

  // ── Today's attendance ───────────────────────────────────────────────────
  const { total: presentToday, isPending: attLoading } = useGetList(
    "attendance",
    { ...LIST_OPTIONS, filter: { date: TODAY, status: "present" } },
    STALE,
  );
  const { total: absentToday } = useGetList(
    "attendance",
    { ...LIST_OPTIONS, filter: { date: TODAY, status: "absent" } },
    STALE,
  );

  // ── Leaves ───────────────────────────────────────────────────────────────
  const { total: pendingLeaves, isPending: leaveLoading } = useGetList(
    "leaves",
    { ...LIST_OPTIONS, filter: { status: "pending" } },
    STALE,
  );

  // ── Daily tasks ──────────────────────────────────────────────────────────
  const { total: pendingTasks, isPending: taskLoading } = useGetList(
    "daily_tasks",
    { ...LIST_OPTIONS, filter: { status: "pending" } },
    STALE,
  );
  const { total: tasksUnderReview } = useGetList(
    "daily_tasks",
    { ...LIST_OPTIONS, filter: { status: "under-review" } },
    STALE,
  );

  // ── Student pipeline ─────────────────────────────────────────────────────
  const { total: totalLeads, isPending: leadLoading } = useGetList(
    "students",
    { ...LIST_OPTIONS, filter: {} },
    STALE,
  );
  const { total: newLeads } = useGetList(
    "students",
    { ...LIST_OPTIONS, filter: { stage: "new-lead" } },
    STALE,
  );
  const { total: joinedLeads } = useGetList(
    "students",
    { ...LIST_OPTIONS, filter: { stage: "joined" } },
    STALE,
  );

  const conversionRate =
    totalLeads && joinedLeads != null
      ? `${Math.round((joinedLeads / totalLeads) * 100)}%`
      : "—";

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    dateStyle: "long",
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">HR Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview for {todayLabel}
        </p>
      </div>

      {/* ── Workforce ──────────────────────────────────────────────────── */}
      <SectionHeader title="Workforce" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={totalAllEmployees ?? 0}
          icon={Users}
          color="bg-blue-500"
          to="/employees"
          sub={`${activeEmployees ?? 0} active`}
          loading={empLoading}
        />
        <StatCard
          title="Present Today"
          value={presentToday ?? 0}
          icon={UserCheck}
          color="bg-green-500"
          to="/attendance"
          sub="marked present"
          loading={attLoading}
        />
        <StatCard
          title="Absent Today"
          value={absentToday ?? 0}
          icon={UserX}
          color="bg-red-500"
          to="/attendance"
          sub="marked absent"
          loading={attLoading}
        />
        <StatCard
          title="Pending Leaves"
          value={pendingLeaves ?? 0}
          icon={CalendarClock}
          color="bg-orange-500"
          to="/leaves"
          sub="awaiting approval"
          loading={leaveLoading}
        />
      </div>

      {/* ── Daily Tasks ────────────────────────────────────────────────── */}
      <SectionHeader title="Daily Tasks" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Pending Tasks"
          value={pendingTasks ?? 0}
          icon={ClipboardList}
          color="bg-yellow-500"
          to="/daily_tasks"
          sub="not yet reviewed"
          loading={taskLoading}
        />
        <StatCard
          title="Under Review"
          value={tasksUnderReview ?? 0}
          icon={Clock}
          color="bg-purple-500"
          to="/daily_tasks"
          sub="being reviewed"
          loading={taskLoading}
        />
        <StatCard
          title="Today"
          value={new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
          icon={ClipboardList}
          color="bg-slate-500"
        />
      </div>

      {/* ── Student Pipeline ───────────────────────────────────────────── */}
      <SectionHeader title="Student Lead Pipeline" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Leads"
          value={totalLeads ?? 0}
          icon={GraduationCap}
          color="bg-indigo-500"
          to="/students"
          sub="all pipeline stages"
          loading={leadLoading}
        />
        <StatCard
          title="New Leads"
          value={newLeads ?? 0}
          icon={TrendingUp}
          color="bg-cyan-500"
          to="/students"
          sub="awaiting contact"
          loading={leadLoading}
        />
        <StatCard
          title="Conversion Rate"
          value={conversionRate}
          icon={UserCheck}
          color="bg-emerald-500"
          to="/students"
          sub={`${joinedLeads ?? 0} joined`}
          loading={leadLoading}
        />
      </div>

      {/* ── Pending Leave Approvals ────────────────────────────────────── */}
      <SectionHeader title="Pending Leave Requests" />
      <PendingLeaveApprovals />

      {/* ── Quick Links ────────────────────────────────────────────────── */}
      <SectionHeader title="Quick Links" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_LINKS.map(({ label, to, color }) => (
          <Link
            key={to}
            to={to}
            className={`block rounded-lg border-2 ${color} px-4 py-3 text-sm font-medium text-center no-underline hover:bg-muted transition-colors`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
};

// ── Pending leave approval panel ──────────────────────────────────────────────

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  casual: "Casual",
  other: "Other",
};

const PendingLeaveApprovals = () => {
  const notify = useNotify();
  const refresh = useRefresh();
  const [update] = useUpdate();

  const { data: pendingLeaves, isPending } = useGetList<Leave>(
    "leaves",
    {
      filter: { status: "pending" },
      pagination: { page: 1, perPage: 10 },
      sort: { field: "created_at", order: "ASC" },
    },
    { staleTime: 0 },
  );

  const act = async (record: Leave, status: "approved" | "rejected") => {
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

  if (isPending) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!pendingLeaves?.length) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No pending leave requests.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {pendingLeaves.map((leave) => {
        const days =
          Math.ceil(
            (new Date(leave.end_date).getTime() -
              new Date(leave.start_date).getTime()) /
              86400000,
          ) + 1;
        return (
          <Card key={leave.id}>
            <CardContent className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="outline" className="shrink-0 text-xs">
                  {LEAVE_TYPE_LABELS[leave.leave_type] ?? leave.leave_type}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {leave.start_date} → {leave.end_date}
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                      ({days}d)
                    </span>
                  </p>
                  {leave.reason && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      {leave.reason}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-green-700 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                  onClick={() => act(leave, "approved")}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-red-700 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => act(leave, "rejected")}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {(pendingLeaves?.length ?? 0) >= 10 && (
        <Link
          to="/leaves?filter=%7B%22status%22%3A%22pending%22%7D"
          className="block text-center text-xs text-blue-600 hover:underline pt-1"
        >
          View all pending leaves →
        </Link>
      )}
    </div>
  );
};

const QUICK_LINKS = [
  {
    label: "Add Student Lead",
    to: "/students/create",
    color: "border-indigo-300 dark:border-indigo-700",
  },
  {
    label: "Mark Attendance",
    to: "/attendance/create",
    color: "border-green-300 dark:border-green-700",
  },
  {
    label: "Apply Leave",
    to: "/leaves/create",
    color: "border-orange-300 dark:border-orange-700",
  },
  {
    label: "Submit Task",
    to: "/daily_tasks/create",
    color: "border-yellow-300 dark:border-yellow-700",
  },
  {
    label: "Add Employee",
    to: "/employees/create",
    color: "border-blue-300 dark:border-blue-700",
  },
  {
    label: "View Attendance",
    to: "/attendance",
    color: "border-slate-300 dark:border-slate-600",
  },
  {
    label: "Leave Requests",
    to: "/leaves",
    color: "border-red-300 dark:border-red-700",
  },
  {
    label: "Task Reports",
    to: "/daily_tasks",
    color: "border-purple-300 dark:border-purple-700",
  },
];
