/**
 * AdminAttendanceDashboard — premium admin view for daily attendance.
 *
 * Shows:
 *  • Date navigator
 *  • 4 gradient stat cards (Present / Working / Checked Out / No Record)
 *  • Employee attendance card grid — one card per employee, colour-coded
 *    by attendance status (initials avatar, name, dept, check-in/out, hours)
 */
import { useMemo, useState } from "react";
import { useGetList } from "ra-core";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  Clock,
  UserX,
  LogIn,
  LogOut,
} from "lucide-react";
import type { Attendance, Employee } from "../types";

// ── helpers ────────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string): string {
  if (iso === TODAY) return "Today";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toHHMM(t: string): string {
  return t.slice(0, 5);
}

function calcHours(checkIn: string, checkOut: string): string {
  const [ih, im] = checkIn.split(":").map(Number);
  const [oh, om] = checkOut.split(":").map(Number);
  const mins = oh * 60 + om - (ih * 60 + im);
  if (mins <= 0) return "0h";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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

// ── Card-level style per attendance state ─────────────────────────────────────

type CardStyle = {
  bg: string;
  border: string;
  dot: string;
  status: string;
  dotBg: string;
};

function getCardStyle(att: Attendance | null | undefined): CardStyle {
  if (!att) {
    return {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-100 dark:border-red-900/50",
      dot: "bg-red-400",
      dotBg: "bg-red-100 dark:bg-red-900/40",
      status: "No Record",
    };
  }
  if (att.status === "absent") {
    return {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-100 dark:border-red-900/50",
      dot: "bg-red-500",
      dotBg: "bg-red-100 dark:bg-red-900/40",
      status: "Absent",
    };
  }
  if (att.status === "half-day") {
    return {
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
      border: "border-yellow-100 dark:border-yellow-900/50",
      dot: "bg-yellow-400",
      dotBg: "bg-yellow-100 dark:bg-yellow-900/40",
      status: "Half Day",
    };
  }
  if (att.status === "leave") {
    return {
      bg: "bg-indigo-50 dark:bg-indigo-950/20",
      border: "border-indigo-100 dark:border-indigo-900/50",
      dot: "bg-indigo-400",
      dotBg: "bg-indigo-100 dark:bg-indigo-900/40",
      status: "On Leave",
    };
  }
  // present
  if (att.check_in && att.check_out) {
    return {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-100 dark:border-blue-900/50",
      dot: "bg-blue-500",
      dotBg: "bg-blue-100 dark:bg-blue-900/40",
      status: "Checked Out",
    };
  }
  if (att.check_in) {
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      border: "border-emerald-100 dark:border-emerald-900/50",
      dot: "bg-emerald-500",
      dotBg: "bg-emerald-100 dark:bg-emerald-900/40",
      status: "Working",
    };
  }
  return {
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-green-100 dark:border-green-900/50",
    dot: "bg-green-400",
    dotBg: "bg-green-100 dark:bg-green-900/40",
    status: "Present",
  };
}

// Sort order: Working > Checked Out > Present > Half Day > Leave > No Record > Absent
const SORT_ORDER: Record<string, number> = {
  Working: 0,
  "Checked Out": 1,
  Present: 2,
  "Half Day": 3,
  "On Leave": 4,
  "No Record": 5,
  Absent: 6,
};

// ── Stat card ──────────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  gradient,
  icon: Icon,
  sub,
}: {
  label: string;
  value: number;
  gradient: string;
  icon: React.ElementType;
  sub?: string;
}) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl p-5 text-white shadow-md",
      gradient,
    )}
  >
    <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">
          {label}
        </p>
        <Icon className="h-4 w-4 text-white/70" />
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-white/70 text-xs mt-1">{sub}</p>}
    </div>
  </div>
);

// ── Employee attendance card ────────────────────────────────────────────────────

const EmployeeCard = ({
  employee,
  attendance,
}: {
  employee: Employee;
  attendance: Attendance | null | undefined;
}) => {
  const style = getCardStyle(attendance);
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-shadow hover:shadow-md",
        style.bg,
        style.border,
      )}
    >
      {/* Top row: avatar + name + status dot */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0",
            deptColor(employee.department),
          )}
        >
          {getInitials(employee.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">
            {employee.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {employee.department}
          </p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
            style.dotBg,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
          {style.status}
        </span>
      </div>

      {/* Check-in / out / hours */}
      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-0.5">
            <LogIn className="h-2.5 w-2.5" />
            In
          </p>
          <p className="text-xs font-bold tabular-nums">
            {attendance?.check_in ? toHHMM(attendance.check_in) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-0.5">
            <LogOut className="h-2.5 w-2.5" />
            Out
          </p>
          <p className="text-xs font-bold tabular-nums">
            {attendance?.check_out ? toHHMM(attendance.check_out) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            Hrs
          </p>
          <p className="text-xs font-bold tabular-nums">
            {attendance?.check_in && attendance?.check_out
              ? calcHours(attendance.check_in, attendance.check_out)
              : attendance?.working_hours
                ? `${attendance.working_hours}h`
                : "—"}
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────

export const AdminAttendanceDashboard = () => {
  const [date, setDate] = useState(TODAY);

  const { data: employees, isPending: empLoading } = useGetList<Employee>(
    "employees",
    {
      filter: { status: "active" },
      pagination: { page: 1, perPage: 200 },
      sort: { field: "name", order: "ASC" },
    },
    { staleTime: 5 * 60 * 1000 },
  );

  const { data: attendanceRecords, isPending: attLoading } =
    useGetList<Attendance>(
      "attendance",
      {
        filter: { date },
        pagination: { page: 1, perPage: 300 },
        sort: { field: "employee_id", order: "ASC" },
      },
      { staleTime: 0 },
    );

  // Build employee_id → attendance record map
  const attMap = useMemo(() => {
    const m: Record<string, Attendance> = {};
    (attendanceRecords ?? []).forEach((a) => {
      m[String(a.employee_id)] = a;
    });
    return m;
  }, [attendanceRecords]);

  // Compute stats
  const totalEmp = employees?.length ?? 0;
  const presentCount = (attendanceRecords ?? []).filter(
    (a) => a.status === "present",
  ).length;
  const workingCount = (attendanceRecords ?? []).filter(
    (a) => a.check_in && !a.check_out,
  ).length;
  const checkedOutCount = (attendanceRecords ?? []).filter(
    (a) => a.check_in && a.check_out,
  ).length;
  const noRecordCount = totalEmp - (attendanceRecords?.length ?? 0);

  // Merged + sorted employee list
  const sorted = useMemo(() => {
    if (!employees) return [];
    return [...employees].sort((a, b) => {
      const sa = SORT_ORDER[getCardStyle(attMap[String(a.id)]).status] ?? 9;
      const sb = SORT_ORDER[getCardStyle(attMap[String(b.id)]).status] ?? 9;
      return sa - sb;
    });
  }, [employees, attMap]);

  const isLoading = empLoading || attLoading;

  return (
    <div className="max-w-5xl mx-auto mt-4 pb-10 space-y-5">
      {/* ── Date navigator ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Attendance Dashboard</h1>
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-2 py-1.5">
          <button
            onClick={() => setDate((d) => addDays(d, -1))}
            className="p-1 rounded-lg hover:bg-background transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold min-w-[160px] text-center">
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
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Present"
            value={presentCount}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            icon={UserCheck}
            sub={`of ${totalEmp} employees`}
          />
          <StatCard
            label="Working Now"
            value={workingCount}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            icon={Clock}
            sub="clocked in, active"
          />
          <StatCard
            label="Checked Out"
            value={checkedOutCount}
            gradient="bg-gradient-to-br from-purple-500 to-violet-600"
            icon={Users}
            sub="completed day"
          />
          <StatCard
            label="No Record"
            value={noRecordCount}
            gradient="bg-gradient-to-br from-rose-500 to-red-600"
            icon={UserX}
            sub="not marked yet"
          />
        </div>
      )}

      {/* ── Employee attendance grid ─────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          No active employees found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              attendance={attMap[String(emp.id)]}
            />
          ))}
        </div>
      )}
    </div>
  );
};
