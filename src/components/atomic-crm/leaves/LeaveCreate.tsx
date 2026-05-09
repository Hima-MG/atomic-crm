import { useState } from "react";
import {
  useCreate,
  useGetIdentity,
  useGetList,
  useNotify,
  useRedirect,
} from "ra-core";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, Send } from "lucide-react";

const LEAVE_TYPES = [
  { id: "casual", label: "Casual", emoji: "🌴" },
  { id: "sick", label: "Sick", emoji: "🤒" },
  { id: "annual", label: "Annual", emoji: "✈️" },
  { id: "other", label: "Other", emoji: "📋" },
] as const;

type LeaveTypeId = (typeof LEAVE_TYPES)[number]["id"];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export const LeaveCreate = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const redirect = useRedirect();
  const [create, { isPending }] = useCreate();

  // Resolve current user's employee record
  const { data: employees, isPending: empLoading } = useGetList("employees", {
    filter: { email: identity?.email },
    pagination: { page: 1, perPage: 1 },
    sort: { field: "id", order: "ASC" },
  });
  const employee = employees?.[0];

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveTypeId>("casual");
  const [startDate, setStartDate] = useState(tomorrow());
  const [endDate, setEndDate] = useState(tomorrow());
  const [reason, setReason] = useState("");

  const days = (() => {
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    const d = Math.ceil(ms / 86400000) + 1;
    return d > 0 ? d : 1;
  })();

  const canSubmit =
    !!employee && !!leaveType && !!startDate && !!endDate && !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await create(
      "leaves",
      {
        data: {
          employee_id: employee!.id,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim() || null,
          status: "pending",
        },
      },
      {
        onSuccess: () => {
          notify("Leave request submitted", { type: "success" });
          redirect("list", "leaves");
        },
        onError: () => {
          notify("Failed to submit leave request", { type: "error" });
        },
        returnPromise: true,
      },
    );
  };

  if (empLoading) {
    return (
      <div className="max-w-lg mx-auto mt-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-4 pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-orange-500" />
          Apply for Leave
        </h1>
        {employee && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {employee.name} · {employee.department}
          </p>
        )}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Leave type pills */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Leave Type</Label>
            <div className="flex flex-wrap gap-2">
              {LEAVE_TYPES.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLeaveType(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all",
                    id === leaveType
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-orange-400 hover:text-foreground",
                  )}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="start"
                  className="text-xs text-muted-foreground"
                >
                  From
                </Label>
                <Input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end" className="text-xs text-muted-foreground">
                  To
                </Label>
                <Input
                  id="end"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {days} day{days !== 1 ? "s" : ""} requested
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Briefly describe the reason for your leave…"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Send className="h-4 w-4" />
              {isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
