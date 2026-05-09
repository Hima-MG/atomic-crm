import { Error as ErrorFallback } from "@/components/admin/error";
import { Notification } from "@/components/admin/notification";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useConfigurationLoader } from "../root/useConfigurationLoader";
import { CivilezyMobileNavigation } from "./CivilezyMobileNavigation";

export const MobileLayout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  return (
    <>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<Skeleton className="h-12 w-12 rounded-full" />}>
          <div className="pb-14">{children}</div>
        </Suspense>
      </ErrorBoundary>
      <CivilezyMobileNavigation />
      <Notification mobileOffset={{ bottom: "72px" }} />
    </>
  );
};
