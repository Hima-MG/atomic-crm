import { type ReactNode } from "react";
import { useGetIdentity } from "ra-core";
import { Layout } from "./Layout";
import { EmployeeLayout } from "./EmployeeLayout";

/**
 * Top-level layout that routes admin users to the full admin shell
 * and regular employees to the stripped-down employee workspace.
 * Identity is already cached in localStorage after login so there is
 * no noticeable flash between renders.
 */
export const CivilezyLayout = ({ children }: { children: ReactNode }) => {
  const { identity, isPending } = useGetIdentity();

  // While identity loads show the admin layout as skeleton — it shares
  // the same header skeleton, so there is no layout jump for admins.
  if (isPending) return <Layout>{children}</Layout>;

  if (identity?.administrator === true) {
    return <Layout>{children}</Layout>;
  }

  return <EmployeeLayout>{children}</EmployeeLayout>;
};
