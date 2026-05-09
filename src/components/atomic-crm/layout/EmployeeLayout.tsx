import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Building2,
  FileText,
  GraduationCap,
  User,
} from "lucide-react";
import { useGetIdentity, useTranslate, useUserMenu } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";
import { Notification } from "@/components/admin/notification";
import { Error as ErrorFallback } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { UserMenu } from "@/components/admin/user-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useConfigurationLoader } from "../root/useConfigurationLoader";
import { ChangelogPage } from "../misc/ChangelogPage";

const BASE_NAV_ITEMS = [
  { label: "Dashboard", to: "/", match: "/" },
  {
    label: "Attendance",
    to: "/attendance",
    match: "/attendance/*",
    icon: CalendarCheck,
  },
  { label: "Leave", to: "/leaves", match: "/leaves/*", icon: CalendarClock },
  {
    label: "Daily Tasks",
    to: "/daily_tasks",
    match: "/daily_tasks/*",
    icon: ClipboardList,
  },
];

const CRE_EXTRA_ITEMS = [
  {
    label: "Student Leads",
    to: "/students",
    match: "/students/*",
    icon: GraduationCap,
  },
];

const EmployeeHeader = () => {
  const location = useLocation();
  const { identity } = useGetIdentity();
  const isCRE = identity?.role === "cre";
  const navItems = isCRE
    ? [...BASE_NAV_ITEMS, ...CRE_EXTRA_ITEMS]
    : BASE_NAV_ITEMS;

  return (
    <header className="bg-secondary border-b">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between items-center h-12">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 text-secondary-foreground no-underline shrink-0"
          >
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="text-base font-bold tracking-tight">Civilezy</span>
          </Link>

          {/* Nav tabs */}
          <nav className="flex">
            {navItems.map(({ label, to, match, icon: Icon }) => {
              const isActive =
                match === "/"
                  ? !!matchPath("/", location.pathname)
                  : !!matchPath(match, location.pathname);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? "text-secondary-foreground border-blue-600"
                      : "text-secondary-foreground/60 border-transparent hover:text-secondary-foreground/80"
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1">
            {identity && (
              <span className="hidden sm:block text-xs text-muted-foreground mr-2">
                {identity.fullName}
              </span>
            )}
            <ThemeModeToggle />
            <UserMenu>
              <EmployeeProfileMenu />
              <EmployeeChangelogMenuItem />
            </UserMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

const EmployeeProfileMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) return null;
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/profile" className="flex items-center gap-2">
        <User className="h-4 w-4" />
        {translate("crm.profile.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const EmployeeChangelogMenuItem = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) return null;
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to={ChangelogPage.path} className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        {translate("crm.changelog.title")}
      </Link>
    </DropdownMenuItem>
  );
};

export const EmployeeLayout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  return (
    <>
      <EmployeeHeader />
      <main className="max-w-screen-xl mx-auto pt-4 px-4" id="main-content">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<Skeleton className="h-12 w-12 rounded-full" />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Notification />
    </>
  );
};
