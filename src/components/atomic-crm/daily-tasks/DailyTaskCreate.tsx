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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Clock, Send } from "lucide-react";

const TODAY = new Date().toISOString().slice(0, 10);

const CATEGORIES = [
  "Content Creation",
  "Video/Reel Preparation",
  "Website & App Management",
  "Student Support",
  "Admissions & Enrollments",
  "Social Media",
  "Admin & Accounts",
  "Meetings/Sessions",
  "Research & Learning",
  "Miscellaneous",
];

export const DailyTaskCreate = () => {
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
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(TODAY);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showTime, setShowTime] = useState(false);

  const totalTime =
    startTime && endTime
      ? (() => {
          const [sh, sm] = startTime.split(":").map(Number);
          const [eh, em] = endTime.split(":").map(Number);
          const mins = eh * 60 + em - (sh * 60 + sm);
          return mins > 0 ? parseFloat((mins / 60).toFixed(2)) : null;
        })()
      : null;

  const canSubmit = !!employee && !!category && !!title.trim() && !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await create(
      "daily_tasks",
      {
        data: {
          employee_id: employee!.id,
          department: employee!.department ?? "",
          submission_date: date,
          category,
          task_title: title.trim(),
          description: description.trim() || null,
          status: "pending",
          start_time: showTime && startTime ? startTime : null,
          end_time: showTime && endTime ? endTime : null,
          total_time: showTime && totalTime != null ? totalTime : null,
        },
      },
      {
        onSuccess: () => {
          notify("Task submitted successfully", { type: "success" });
          redirect("list", "daily_tasks");
        },
        onError: () => {
          notify("Failed to submit task", { type: "error" });
        },
        returnPromise: true,
      },
    );
  };

  if (empLoading) {
    return (
      <div className="max-w-2xl mx-auto mt-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-4 pb-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Submit Work Report
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {employee
              ? `Logged as ${employee.name} · ${employee.department}`
              : "Log what you worked on today"}
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-normal">
          {new Date(date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-sm font-medium">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              max={TODAY}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
          </div>

          {/* Category chips */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat === category ? "" : cat)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    cat === category
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-blue-400 hover:text-foreground",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Task title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-medium">
              Task Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Created Instagram reel for May batch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-sm font-medium">
              Details{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="desc"
              placeholder="Any extra context, links, or notes..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Time tracking — optional */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowTime(!showTime)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Clock className="h-3.5 w-3.5" />
              {showTime ? "Hide time tracking" : "Add time tracking (optional)"}
            </button>

            {showTime && (
              <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-muted/50 border">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Start time
                  </Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-32"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    End time
                  </Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-32"
                  />
                </div>
                {totalTime != null && (
                  <div className="pb-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {totalTime} hr{totalTime !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isPending ? "Submitting…" : "Submit Report"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
