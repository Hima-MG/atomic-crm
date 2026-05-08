import { useState } from "react";
import { useGetList, useCreate, useUpdate, useNotify } from "ra-core";
import { Clock, LogIn, LogOut, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Attendance } from "../types";

const TODAY = new Date().toISOString().slice(0, 10);

function toHHMM(timeStr: string): string {
  return timeStr.slice(0, 5);
}

function calcHours(checkIn: string, checkOut: string): string {
  const [ih, im] = checkIn.split(":").map(Number);
  const [oh, om] = checkOut.split(":").map(Number);
  const mins = oh * 60 + om - (ih * 60 + im);
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
      notify("Punched in successfully", { type: "success" });
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
      notify("Punched out successfully", { type: "success" });
    } catch {
      notify("Failed to punch out", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-100 dark:border-blue-900">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Today's Attendance
            </p>
            <p className="text-sm font-semibold">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            {checkedIn && (
              <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <LogIn className="h-3 w-3 text-green-600" />
                  In: {toHHMM(record!.check_in!)}
                </span>
                {checkedOut && (
                  <>
                    <span className="flex items-center gap-1">
                      <LogOut className="h-3 w-3 text-red-500" />
                      Out: {toHHMM(record!.check_out!)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-500" />
                      {calcHours(record!.check_in!, record!.check_out!)}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {!checkedIn && (
              <Button
                onClick={handlePunchIn}
                disabled={busy}
                className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Punch In
              </Button>
            )}
            {checkedIn && !checkedOut && (
              <Button
                onClick={handlePunchOut}
                disabled={busy}
                variant="destructive"
                className="gap-1.5"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Punch Out
              </Button>
            )}
            {checkedOut && (
              <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Day Complete
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
