import { useGetIdentity } from "ra-core";
import { Dashboard } from "./Dashboard";
import { EmployeeDashboard } from "./EmployeeDashboard";

export const RoleSwitchDashboard = () => {
  const { identity, isPending } = useGetIdentity();

  if (isPending) return null;

  if (identity?.administrator === true) {
    return <Dashboard />;
  }

  return <EmployeeDashboard />;
};
