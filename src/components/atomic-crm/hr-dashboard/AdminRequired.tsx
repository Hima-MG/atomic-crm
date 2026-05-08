import { useEffect } from "react";
import { useGetIdentity, useAuthProvider } from "ra-core";
import { useNavigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Wraps any page that should only be accessible by admins.
 * Redirects non-admin authenticated users back to the dashboard.
 */
export const AdminRequired = ({ children }: { children: React.ReactNode }) => {
  const { identity, isPending } = useGetIdentity();
  const authProvider = useAuthProvider();
  const navigate = useNavigate();

  useEffect(() => {
    if (isPending) return;

    authProvider
      ?.canAccess?.({ resource: "configuration", action: "edit" })
      .then((allowed) => {
        if (!allowed) {
          navigate("/", { replace: true });
        }
      });
  }, [isPending, identity, authProvider, navigate]);

  if (isPending) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return <>{children}</>;
};
