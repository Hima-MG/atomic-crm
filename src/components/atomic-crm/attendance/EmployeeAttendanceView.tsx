/**
 * EmployeeAttendanceView — premium punch-in/out workspace for employees.
 *
 * Replaces the legacy admin table for non-admin users. Shows:
 *   • Live clock + gradient hero punch card
 *   • Big contextual Punch In / Punch Out button
 *   • Today's check-in, check-out, hours summary
 *   • Recent attendance history (last 14 records)
 */
import { useEffect, useState } from "react";
import {
  useCreate,
  useGetIdentity,
  useGetList,
  useNotify,
  useUpdate,
} from "ra-core";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  Loader2,
} from "lucide-react";
import type { Attendance, Employee } from "../types";

// ── helpers ────────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

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

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const STATUS_META: Record<
  string,
  { label: string; cls: string; dot: string }
> = {
  present: {
    label: "Present",
    cls: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    dot: "bg-green-500",
  },
  absent: {
    label: "Absent",
    cls: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    dot: "bg-red-500",
  },
  "half-day": {
    label: "Half Day",
    cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    dot: "bg-yellow-500",
  },
  leave: {
    label: "On Leave",
    cls: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    dot: "bg-blue-500",
  },
};

// ── Live clock ─────────────────────────────────────────────────────────────────

function useLiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ── Main component ─────────────────────────────────────────────────────────────

export const EmployeeAttendanceView = () => {
  const { identity } = useGetIdentity();
  const clock = useLiveClock();

  // Resolve employee record
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

  // Today's record
  const {
    data: todayData,
    isPending: todayLoading,
    refetch,
  } = useGetList<Attendance>(
    "attendance",
    {
      filter: { employee_id: employee?.id, date: TODAY },
      pagination: { page: 1, perPage: 1 },
      sort: { field: "created_at", order: "DESC" },
    },
    { enabled: !!employee?.id, staleTime: 0 },
  );
  const record = todayData?.[0];
  const checkedIn = !!record?.check_in;
  const checkedOut = !!record?.check_out;

  // Recent history
  const { data: history, isPending: historyLoading } = useGetList<Attendance>(
    "attendance",
    {
      filter: { employee_id: employee?.id },
      pagination: { page: 1, perPage: 14 },
      sort: { field: "date", order: "DESC" },
    },
    { enabled: !!employee?.id, staleTime: 60_000 },
  );

  const notify = useNotify();
  const [busy, setBusy] = useState(false);
  const [create] = useCreate();
  const [update] = useUpdate();

  const nowTime = () => new Date().toTimeString().slice(0, 8);

  const handlePunchIn = async () => {
    setBusy(true);
    try {
      await create(
        "attendance",
        {
          data: {
            employee_id: employee!.id,
            date: TODAY,
            check_in: nowTime(),
            status: "present",
          },
        },
        { returnPromise: true },
      );
      await refetch();
      notify("Punched in ✓", { type: "success" });
    } catch {
      notify("Failed to punch in", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handlePunchOut = async () => {
    if (!record) return;
    setBusy(true);
    const checkOut = nowTime();
    const workingHours = record.check_in
      ? parseFloat(
          (
            (new Date(`1970-01-01T${checkOut}`).getTime() -
              new Date(`1970-01-01T${record.check_in}`).getTime()) /
            3600000
          ).toFixed(2),
        )
      : undefined;
    try {
      await update(
        "attendance",
        {
          id: record.id,
          data: { check_out: checkOut, working_hours: workingHours },
          previousData: record,
        },
        { returnPromise: true },
      );
      await refetch();
      notify("Punched out ✓", { type: "success" });
    } catch {
      notify("Failed to punch out", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  // Gradient based on state
  const heroGradient = checkedOut
    ? "from-purple-600 via-violet-600 to-indigo-700"
    : checkedIn
      ? "from-emerald-500 via-green-500 to-teal-600"
      : "from-blue-600 via-blue-500 to-indigo-600";

  const stateLabel = checkedOut
    ? "Day Complete"
    : checkedIn
      ? "Working"
      : "Not Checked In";

  if (empLoading || todayLoading) {
    return (
      <div className="max-w-lg mx-auto mt-4 space-y-4">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-4 pb-20 space-y-4">
      {/* ── Hero punch card ───────────────────────────────────────────── */}
      <div
        className={cn(
          "rounded-2xl bg-gradient-to-br text-white p-6 shadow-lg",
          heroGradient,
        )}
      >
        {/* Top row: name + status */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm font-medium">
              {employee?.department ?? "Employee"} ·{" "}
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h2 className="text-xl font-bold mt-0.5">
              {identity?.fullName?.split(" ")[0]}'s Attendance
            </h2>
          </div>
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 border border-white/30",
            )}
          >
            {stateLabel}
          </span>
        </div>

        {/* Live clock */}
        <div className="text-center my-4">
          <p className="text-5xl font-bold tracking-tight tabular-nums">
            {clock.slice(0, 5)}
          </p>
          <p className="text-white/60 text-xs mt-1 tabular-nums">
            {clock.slice(6)}s
          </p>
        </div>

        {/* Check-in / out times */}
        {checkedIn && (
          <div className="flex justify-center gap-6 text-sm mt-4">
            <div className="text-center">
              <p className="text-white/60 text-xs">Check In</p>
              <p className="font-semibold tabular-nums">
                {toHHMM(record!.check_in!)}
              </p>
            </div>
            {checkedOut && (
              <>
                <div className="w-px bg-white/30" />
                <div className="text-center">
                  <p className="text-white/60 text-xs">Check Out</p>
                  <p className="font-semibold tabular-nums">
                    {toHHMM(record!.check_out!)}
                  </p>
                </div>
                <div className="w-px bg-white/30" />
                <div className="text-center">
                  <p className="text-white/60 text-xs">Hours</p>
                  <p className="font-semibold">
                    {calcHours(record!.check_in!, record!.check_out!)}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Punch action button ───────────────────────────────────────── */}
      {!checkedIn && (
        <button
          onClick={handlePunchIn}
          disabled={busy || !employee}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all",
            "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg",
            "hover:shadow-emerald-200 hover:scale-[1.01] active:scale-[0.99]",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100",
          )}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          {busy ? "Punching In…" : "Punch In"}
        </button>
      )}
      {checkedIn && !checkedOut && (
        <button
          onClick={handlePunchOut}
          disabled={busy}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all",
            "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg",
            "hover:shadow-rose-200 hover:scale-[1.01] active:scale-[0.99]",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100",
          )}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          {busy ? "Punching Out…" : "Punch Out"}
        </button>
      )}
      {checkedOut && (
        <div className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border border-purple-200 dark:border-purple-800">
          <CheckCircle2 className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-700 dark:text-purple-300">
            Great work today! Day complete 🎉
          </span>
        </div>
      )}

      {/* ── Today's stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatChip
          icon={<LogIn className="h-4 w-4 text-green-600" />}
          label="Check In"
          value={record?.check_in ? toHHMM(record.check_in) : "—"}
          colorClass="bg-green-50 dark:bg-green-950"
        />
        <StatChip
          icon={<LogOut className="h-4 w-4 text-rose-500" />}
          label="Check Out"
          value={record?.check_out ? toHHMM(record.check_out) : "—"}
          colorClass="bg-rose-50 dark:bg-rose-950"
        />
        <StatChip
          icon={<Clock className="h-4 w-4 text-blue-600" />}
          label="Hours"
          value={
            record?.check_in && record?.check_out
              ? calcHours(record.check_in, record.check_out)
              : "—"
          }
          colorClass="bg-blue-50 dark:bg-blue-950"
        />
      </div>

      {/* ── Recent history ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Recent History
          </p>
        </div>

        {historyLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : !history?.length ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No attendance records yet.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((att) => {
              const meta = STATUS_META[att.status] ?? STATUS_META.present;
              const isToday = att.date === TODAY;
              return (
                <div
                  key={att.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border bg-card",
                    isToday &&
                      "ring-1 ring-blue-400 dark:ring-blue-600 border-blue-200 dark:border-blue-800",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full shrink-0",
                        meta.dot,
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {fmtDate(att.date)}
                        {isToday && (
                          <span className="ml-1.5 text-xs text-blue-600 font-normal">
                            Today
                          </span>
                        )}
                      </p>
                      {att.check_in && (
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {toHHMM(att.check_in)}
                          {att.check_out && ` → ${toHHMM(att.check_out)}`}
                          {att.working_hours != null &&
                            ` · ${att.working_hours}h`}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={cn("text-xs border-0", meta.cls)}>
                    {meta.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Stat chip ──────────────────────────────────────────────────────────────────

const StatChip = ({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}) => (
  <div className={cn("rounded-xl p-3 text-center border", colorClass)}>
    <div className="flex justify-center mb-1">{icon}</div>
    <p className="text-xs text-muted-foreground font-medium">{label}</p>
    <p className="text-base font-bold tabular-nums mt-0.5">{value}</p>
  </div>
);
