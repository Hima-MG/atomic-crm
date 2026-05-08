import { ShowBase, useShowContext } from "ra-core";
import { EditButton } from "@/components/admin/edit-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, Mail, Calendar, IndianRupee } from "lucide-react";
import type { Employee } from "../types";

const Field = ({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value?: React.ReactNode;
}) => (
  <div className="flex items-start gap-2">
    {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />}
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  </div>
);

const EmployeeShowContent = () => {
  const { record, isPending } = useShowContext<Employee>();
  if (isPending || !record) return null;

  return (
    <div className="mt-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{record.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{record.department}</Badge>
            {record.role && (
              <span className="text-sm text-muted-foreground">
                {record.role}
              </span>
            )}
            <Badge
              className={
                record.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0"
              }
            >
              {record.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <EditButton />
          <DeleteButton redirect="list" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field icon={Phone} label="Phone" value={record.phone} />
          <Field icon={Mail} label="Email" value={record.email} />
          <Field
            icon={Building2}
            label="Department"
            value={record.department}
          />
          <Field
            icon={Calendar}
            label="Joining Date"
            value={
              record.joining_date
                ? new Date(record.joining_date).toLocaleDateString()
                : undefined
            }
          />
          <Field
            icon={IndianRupee}
            label="Salary"
            value={
              record.salary
                ? `₹${record.salary.toLocaleString("en-IN")}`
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export const EmployeeShow = () => (
  <ShowBase>
    <EmployeeShowContent />
  </ShowBase>
);
