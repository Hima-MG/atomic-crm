import { useGetIdentity } from "ra-core";
import { HRDashboard } from "../hr-dashboard/HRDashboard";
import { EmployeeDashboard } from "./EmployeeDashboard";

/**
 * Admins land on the HR / CRM overview dashboard.
 * Employees land on the personal workspace dashboard.
 */
export const RoleSwitchDashboard = () => {
  const { identity, isPending } = useGetIdentity();

  if (isPending) return null;

  if (identity?.administrator === true) {
    return <HRDashboard />;
  }

  return <EmployeeDashboard />;
};
