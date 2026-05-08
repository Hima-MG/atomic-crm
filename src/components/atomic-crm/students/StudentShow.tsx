import { ShowBase, useShowContext } from "ra-core";
import { EditButton } from "@/components/admin/edit-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { Card, CardContent } from "@/components/ui/card";
import type { Student } from "../types";
import {
  STAGE_CHOICES,
  QUALIFICATION_CHOICES,
  LEAD_SOURCE_CHOICES,
} from "./StudentInputs";

const STAGE_COLORS: Record<string, string> = {
  "new-lead": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contacted:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  interested:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "follow-up":
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  joined: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const labelOf = (choices: { id: string; name: string }[], id?: string) =>
  choices.find((c) => c.id === id)?.name ?? id ?? "—";

const Field = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div>
    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
      {label}
    </p>
    <p className="text-sm">{value ?? "—"}</p>
  </div>
);

const StudentShowContent = () => {
  const { record, isPending } = useShowContext<Student>();
  if (isPending || !record) return null;

  const stageLabel = labelOf(STAGE_CHOICES, record.stage);
  const stageColor = STAGE_COLORS[record.stage] ?? "";

  return (
    <div className="mt-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{record.full_name}</h1>
          <span
            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${stageColor}`}
          >
            {stageLabel}
          </span>
        </div>
        <div className="flex gap-2">
          <EditButton />
          <DeleteButton redirect="list" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Phone" value={record.phone} />
          <Field label="Email" value={record.email} />
          <Field
            label="Qualification"
            value={labelOf(QUALIFICATION_CHOICES, record.qualification)}
          />
          <Field label="Interested Course" value={record.interested_course} />
          <Field
            label="Lead Source"
            value={labelOf(LEAD_SOURCE_CHOICES, record.lead_source)}
          />
          <Field label="Follow-up Date" value={record.follow_up_date} />
          <Field
            label="Created"
            value={
              record.created_at
                ? new Date(record.created_at).toLocaleDateString()
                : "—"
            }
          />
        </CardContent>
      </Card>

      {record.notes && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              Notes
            </p>
            <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const StudentShow = () => (
  <ShowBase>
    <StudentShowContent />
  </ShowBase>
);
