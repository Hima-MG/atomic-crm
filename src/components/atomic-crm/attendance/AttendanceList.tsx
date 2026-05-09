import { useGetIdentity } from "ra-core";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminAttendanceDashboard } from "./AdminAttendanceDashboard";
import { EmployeeAttendanceView } from "./EmployeeAttendanceView";

export const AttendanceList = () => {
  const { identity, isPending } = useGetIdentity();

  if (isPending) {
    return (
      <div className="max-w-lg mx-auto mt-6 space-y-4">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  return identity?.administrator === true ? (
    <AdminAttendanceDashboard />
  ) : (
    <EmployeeAttendanceView />
  );
};
