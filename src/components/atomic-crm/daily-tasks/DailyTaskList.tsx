import { useGetIdentity } from "ra-core";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTaskDashboard } from "./AdminTaskDashboard";
import { EmployeeTaskView } from "./EmployeeTaskView";

export const DailyTaskList = () => {
  const { identity, isPending } = useGetIdentity();

  if (isPending) {
    return (
      <div className="max-w-lg mx-auto mt-4 space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return identity?.administrator === true ? (
    <AdminTaskDashboard />
  ) : (
    <EmployeeTaskView />
  );
};
