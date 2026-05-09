/**
 * PunchCard — compact punch-in/out widget used on the employee dashboard.
 *
 * For the full-screen attendance experience see EmployeeAttendanceView.
 */
import { useState } from "react";
import { useGetList, useCreate, useUpdate, useNotify } from "ra-core";
import { cn } from "@/lib/utils";
import { Clock, LogIn, LogOut, CheckCircle2, Loader2 } from "lucide-react";
import type { Attendance } from "../types";

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

export const PunchCard = ({ employeeId }: { employeeId: number | string }) => {
  const notify = useNotify();
  const [busy, setBusy] = useState(false);

  const {
    data: attendance,
    isPending,
    refetch,
  } = useGetList<Attendance>(
    "attendance",
    {
      filter: { employee_id: employeeId, date: TODAY },
      pagination: { page: 1, perPage: 1 },
      sort: { field: "created_at", order: "DESC" },
    },
    { enabled: !!employeeId, staleTime: 0 },
  );

  const [create] = useCreate();
  const [update] = useUpdate();

  const record = attendance?.[0];
  const checkedIn = !!record?.check_in;
  const checkedOut = !!record?.check_out;

  const nowTime = () => new Date().toTimeString().slice(0, 8);

  const handlePunchIn = async () => {
    setBusy(true);
    try {
      await create(
        "attendance",
        {
          data: {
            employee_id: employeeId,
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

  // gradient based on state
  const gradient = checkedOut
    ? "from-purple-600 via-violet-600 to-indigo-700"
    : checkedIn
      ? "from-emerald-500 via-green-500 to-teal-600"
      : "from-blue-600 via-blue-500 to-indigo-600";

  if (isPending) {
    return (
      <div className="rounded-2xl h-28 bg-gradient-to-br from-blue-600 to-indigo-600 animate-pulse" />
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br text-white p-5 shadow-lg",
        gradient,
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left: status info */}
        <div className="space-y-1">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
            Today's Attendance
          </p>
          <p className="text-base font-bold">
            {checkedOut
              ? "Day complete 🎉"
              : checkedIn
                ? "You're clocked in"
                : "Not checked in yet"}
          </p>
          {checkedIn && (
            <div className="flex items-center gap-3 text-xs text-white/80 pt-0.5">
              <span className="flex items-center gap-1">
                <LogIn className="h-3 w-3" />
                {toHHMM(record!.check_in!)}
              </span>
              {checkedOut && (
                <>
                  <span className="flex items-center gap-1">
                    <LogOut className="h-3 w-3" />
                    {toHHMM(record!.check_out!)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="h-3 w-3" />
                    {calcHours(record!.check_in!, record!.check_out!)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: action */}
        <div>
          {!checkedIn && (
            <button
              onClick={handlePunchIn}
              disabled={busy}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm",
                "bg-white/20 border border-white/30 hover:bg-white/30 transition-colors",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Punch In
            </button>
          )}
          {checkedIn && !checkedOut && (
            <button
              onClick={handlePunchOut}
              disabled={busy}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm",
                "bg-white/20 border border-white/30 hover:bg-white/30 transition-colors",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Punch Out
            </button>
          )}
          {checkedOut && (
            <div className="flex items-center gap-1.5 text-white/90 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Done
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
