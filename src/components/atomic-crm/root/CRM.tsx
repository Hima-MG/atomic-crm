import type {
  CoreAdminProps,
  AuthProvider,
  DashboardComponent,
  LayoutComponent,
} from "ra-core";
import { CustomRoutes, localStorageStore, Resource } from "ra-core";
import { useEffect, useMemo } from "react";
import { Route } from "react-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Admin } from "@/components/admin/admin";
import { ForgotPasswordPage } from "@/components/supabase/forgot-password-page";
import { SetPasswordPage } from "@/components/supabase/set-password-page";
import { OAuthConsentPage } from "@/components/supabase/oauth-consent-page";

// ── Civilezy resources ────────────────────────────────────────────────────────
import students from "../students";
import employees from "../employees";
import attendance from "../attendance";
import leaves from "../leaves";
import dailyTasks from "../daily-tasks";
import sales from "../sales";

// ── Dashboards ────────────────────────────────────────────────────────────────
import { RoleSwitchDashboard } from "../dashboard/RoleSwitchDashboard";
import { HRDashboard } from "../hr-dashboard/HRDashboard";

// ── Layouts ───────────────────────────────────────────────────────────────────
import { CivilezyLayout } from "../layout/CivilezyLayout";
import { AdminRoute } from "../layout/AdminRoute";
import { MobileLayout } from "../layout/MobileLayout";

// ── Pages ─────────────────────────────────────────────────────────────────────
import { SignupPage } from "../login/SignupPage";
import { ConfirmationRequired } from "../login/ConfirmationRequired";
import { ChangelogPage } from "../misc/ChangelogPage";
import { ProfilePage } from "../settings/ProfilePage";
import { SettingsPage } from "../settings/SettingsPage";
import { SettingsPageMobile } from "../settings/SettingsPageMobile";
import { StartPage } from "../login/StartPage.tsx";

// ── Providers ─────────────────────────────────────────────────────────────────
import {
  getAuthProvider as defaultAuthProviderBuilder,
  getDataProvider as defaultDataProviderBuilder,
} from "../providers/supabase";
import { i18nProvider as defaulti18nProvider } from "../providers/commons/i18nProvider";
import {
  CONFIGURATION_STORE_KEY,
  type ConfigurationContextValue,
} from "./ConfigurationContext";
import type { CrmDataProvider } from "../providers/types";
import {
  defaultCompanySectors,
  defaultCurrency,
  defaultDarkModeLogo,
  defaultDealCategories,
  defaultDealPipelineStatuses,
  defaultDealStages,
  defaultLightModeLogo,
  defaultNoteStatuses,
  defaultTaskTypes,
  defaultTitle,
} from "./defaultConfiguration";
import { useIsMobile } from "@/hooks/use-mobile.ts";

const defaultStore = localStorageStore(undefined, "CRM");

export type CRMProps = {
  dataProvider?: CrmDataProvider;
  authProvider?: AuthProvider;
  i18nProvider?: CoreAdminProps["i18nProvider"];
  disableTelemetry?: boolean;
  store?: CoreAdminProps["store"];
  dashboard?: DashboardComponent;
  layout?: LayoutComponent;
} & Partial<ConfigurationContextValue>;

export const CRM = ({
  companySectors = defaultCompanySectors,
  currency = defaultCurrency,
  dealCategories = defaultDealCategories,
  dealPipelineStatuses = defaultDealPipelineStatuses,
  dealStages = defaultDealStages,
  darkModeLogo = defaultDarkModeLogo,
  lightModeLogo = defaultLightModeLogo,
  noteStatuses = defaultNoteStatuses,
  taskTypes = defaultTaskTypes,
  title = defaultTitle,
  dataProvider = defaultDataProviderBuilder(),
  authProvider = defaultAuthProviderBuilder(),
  i18nProvider = defaulti18nProvider,
  store = defaultStore,
  googleWorkplaceDomain = import.meta.env.VITE_GOOGLE_WORKPLACE_DOMAIN,
  disableEmailPasswordAuthentication = import.meta.env
    .VITE_DISABLE_EMAIL_PASSWORD_AUTHENTICATION === "true",
  disableTelemetry: _disableTelemetry,
  ...rest
}: CRMProps) => {
  // Seed the store with configuration values on first load
  useEffect(() => {
    if (!store.getItem(CONFIGURATION_STORE_KEY)) {
      store.setItem(CONFIGURATION_STORE_KEY, {
        companySectors,
        currency,
        dealCategories,
        dealPipelineStatuses,
        dealStages,
        noteStatuses,
        taskTypes,
        title,
        darkModeLogo,
        lightModeLogo,
        googleWorkplaceDomain,
        disableEmailPasswordAuthentication,
      } satisfies ConfigurationContextValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  // Pre-fetch configuration after login to avoid first-render flicker
  const wrappedAuthProvider = useMemo<AuthProvider>(
    () => ({
      ...authProvider,
      login: async (params: any) => {
        const result = await authProvider.login(params);
        try {
          const config = await dataProvider.getConfiguration();
          if (Object.keys(config).length > 0) {
            store.setItem(CONFIGURATION_STORE_KEY, config);
          }
        } catch {
          // Non-critical
        }
        return result;
      },
      handleCallback: async (params: any) => {
        if (!authProvider.handleCallback) {
          throw new Error("handleCallback is not implemented in the authProvider");
        }
        const result = await authProvider.handleCallback(params);
        try {
          const config = await dataProvider.getConfiguration();
          if (Object.keys(config).length > 0) {
            store.setItem(CONFIGURATION_STORE_KEY, config);
          }
        } catch {
          // Non-critical
        }
        return result;
      },
      logout: async (params: any) => {
        try {
          store.removeItem(CONFIGURATION_STORE_KEY);
        } catch {
          // Ignore
        }
        return authProvider.logout(params);
      },
    }),
    [authProvider, dataProvider, store],
  );

  const isMobile = useIsMobile();
  const ResponsiveAdmin = isMobile ? MobileAdmin : DesktopAdmin;

  return (
    <ResponsiveAdmin
      dataProvider={dataProvider}
      authProvider={wrappedAuthProvider}
      i18nProvider={i18nProvider}
      store={store}
      loginPage={StartPage}
      requireAuth
      disableTelemetry
      {...rest}
    />
  );
};

// ── Desktop ───────────────────────────────────────────────────────────────────

const DesktopAdmin = (
  props: CoreAdminProps & {
    dashboard?: DashboardComponent;
    layout?: LayoutComponent;
  },
) => (
  <Admin
    layout={props.layout ?? CivilezyLayout}
    dashboard={props.dashboard ?? RoleSwitchDashboard}
    {...props}
  >
    {/* Auth pages — no layout wrapper */}
    <CustomRoutes noLayout>
      <Route path={SignupPage.path} element={<SignupPage />} />
      <Route path={ConfirmationRequired.path} element={<ConfirmationRequired />} />
      <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
      <Route path={ForgotPasswordPage.path} element={<ForgotPasswordPage />} />
      <Route path={OAuthConsentPage.path} element={<OAuthConsentPage />} />
    </CustomRoutes>

    {/* App pages — wrapped in CivilezyLayout */}
    <CustomRoutes>
      <Route path={ProfilePage.path} element={<ProfilePage />} />
      <Route path={SettingsPage.path} element={<SettingsPage />} />
      <Route path={ChangelogPage.path} element={<ChangelogPage />} />
      {/* Admin-only pages are guarded at the component level */}
      <Route
        path="/hr-dashboard"
        element={<AdminRoute element={<HRDashboard />} />}
      />
    </CustomRoutes>

    {/* ── Civilezy resources ─────────────────────────────────────────────── */}
    {/* CRM — admin only (canAccess blocks employees) */}
    <Resource name="students" {...students} />

    {/* EMS — all authenticated users (RLS + canAccess scopes to own data) */}
    <Resource name="employees" {...employees} />
    <Resource name="attendance" {...attendance} />
    <Resource name="leaves" {...leaves} />
    <Resource name="daily_tasks" {...dailyTasks} />

    {/* Platform admin — user management */}
    <Resource name="sales" {...sales} />
  </Admin>
);

// ── Mobile ────────────────────────────────────────────────────────────────────

const MobileAdmin = (
  props: CoreAdminProps & {
    dashboard?: DashboardComponent;
    layout?: LayoutComponent;
  },
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: 1000 * 60 * 60 * 24, networkMode: "offlineFirst" },
      mutations: { networkMode: "offlineFirst" },
    },
  });
  const asyncStoragePersister = createAsyncStoragePersister({
    storage: localStorage,
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <Admin
        queryClient={queryClient}
        layout={props.layout ?? MobileLayout}
        dashboard={props.dashboard ?? RoleSwitchDashboard}
        {...props}
      >
        <CustomRoutes noLayout>
          <Route path={SignupPage.path} element={<SignupPage />} />
          <Route path={ConfirmationRequired.path} element={<ConfirmationRequired />} />
          <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
          <Route path={ForgotPasswordPage.path} element={<ForgotPasswordPage />} />
          <Route path={OAuthConsentPage.path} element={<OAuthConsentPage />} />
        </CustomRoutes>
        <CustomRoutes>
          <Route path={SettingsPageMobile.path} element={<SettingsPageMobile />} />
          <Route path={ChangelogPage.path} element={<ChangelogPage />} />
          <Route path={ProfilePage.path} element={<ProfilePage />} />
        </CustomRoutes>

        <Resource name="students" {...students} />
        <Resource name="employees" {...employees} />
        <Resource name="attendance" {...attendance} />
        <Resource name="leaves" {...leaves} />
        <Resource name="daily_tasks" {...dailyTasks} />
        <Resource name="sales" {...sales} />
      </Admin>
    </PersistQueryClientProvider>
  );
};
