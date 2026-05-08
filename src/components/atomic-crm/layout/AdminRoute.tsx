import { useGetIdentity, useRedirect } from "ra-core";
import { useEffect } from "react";

/**
 * Renders children only for admins.
 * Non-admins are immediately redirected to the root dashboard.
 */
export const AdminRoute = ({ element }: { element: React.ReactNode }) => {
  const { identity, isPending } = useGetIdentity();
  const redirect = useRedirect();

  useEffect(() => {
    if (!isPending && identity?.administrator !== true) {
      redirect("/");
    }
  }, [isPending, identity, redirect]);

  if (isPending) return null;
  if (identity?.administrator !== true) return null;

  return <>{element}</>;
};
