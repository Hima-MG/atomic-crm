import { useGetIdentity } from "ra-core";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLeaveDashboard } from "./AdminLeaveDashboard";
import { EmployeeLeaveView } from "./EmployeeLeaveView";

export const LeaveList = () => {
  const { identity, isPending } = useGetIdentity();

  if (isPending) {
    return (
      <div className="max-w-lg mx-auto mt-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return identity?.administrator === true ? (
    <AdminLeaveDashboard />
  ) : (
    <EmployeeLeaveView />
  );
};
