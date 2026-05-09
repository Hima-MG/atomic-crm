import { useState } from "react";
import { useCreate, useNotify } from "ra-core";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const LEAVE_TYPES = [
  { id: "casual", name: "Casual Leave" },
  { id: "sick", name: "Sick Leave" },
  { id: "annual", name: "Annual Leave" },
  { id: "other", name: "Other" },
];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export const QuickLeaveDialog = ({
  open,
  onOpenChange,
  employeeId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: number | string | undefined;
}) => {
  const notify = useNotify();
  const [create] = useCreate();
  const [busy, setBusy] = useState(false);

  const tmr = tomorrow();
  const [leaveType, setLeaveType] = useState("casual");
  const [startDate, setStartDate] = useState(tmr);
  const [endDate, setEndDate] = useState(tmr);
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!employeeId) {
      notify("Employee record not found", { type: "error" });
      return;
    }
    setBusy(true);
    try {
      await create(
        "leaves",
        {
          data: {
            employee_id: employeeId,
            leave_type: leaveType,
            start_date: startDate,
            end_date: endDate,
            reason: reason || undefined,
            status: "pending",
          },
        },
        { returnPromise: true },
      );
      notify("Leave request submitted", { type: "success" });
      onOpenChange(false);
      // Reset for next time
      setReason("");
      setLeaveType("casual");
      setStartDate(tomorrow());
      setEndDate(tomorrow());
    } catch {
      notify("Failed to submit leave request", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Reason{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              placeholder="Brief reason for leave..."
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
