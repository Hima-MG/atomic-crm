import {
  FileText,
  Settings,
  User,
  Users,
  GraduationCap,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Building2,
} from "lucide-react";
import { CanAccess, useGetIdentity, useTranslate, useUserMenu } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";
import { RefreshButton } from "@/components/admin/refresh-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { UserMenu } from "@/components/admin/user-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { ChangelogPage } from "../misc/ChangelogPage";

const Header = () => {
  const { title } = useConfigurationContext();
  const location = useLocation();
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const isAdmin = identity?.administrator === true;
  const isCRE = !isAdmin && identity?.role === "cre";

  let currentPath: string | boolean = "/";
  if (matchPath("/", location.pathname)) {
    currentPath = "/";
  } else if (matchPath("/students/*", location.pathname)) {
    currentPath = "/students";
  } else if (matchPath("/attendance/*", location.pathname)) {
    currentPath = "attendance";
  } else if (matchPath("/leaves/*", location.pathname)) {
    currentPath = "leaves";
  } else if (matchPath("/daily_tasks/*", location.pathname)) {
    currentPath = "daily_tasks";
  } else {
    currentPath = false;
  }

  return (
    <nav className="grow">
      <header className="bg-secondary">
        <div className="px-4">
          <div className="flex justify-between items-center flex-1">
            {/* Brand */}
            <Link
              to="/"
              className="flex items-center gap-2 text-secondary-foreground no-underline shrink-0"
            >
              <Building2 className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            </Link>

            {/* Main Navigation */}
            <div>
              <nav className="flex">
                <NavigationTab
                  label={translate("ra.page.dashboard")}
                  to="/"
                  isActive={currentPath === "/"}
                />

                {isAdmin ? (
                  // Admin nav — Student Leads only; HR/EMS accessed via dashboard
                  <>
                    <CanAccess resource="students" action="list">
                      <NavigationTab
                        label="Student Leads"
                        to="/students"
                        isActive={currentPath === "/students"}
                        icon={<GraduationCap className="h-4 w-4" />}
                      />
                    </CanAccess>
                  </>
                ) : isCRE ? (
                  // CRE nav — employee workspace + student leads
                  <>
                    <NavigationTab
                      label="Student Leads"
                      to="/students"
                      isActive={currentPath === "/students"}
                      icon={<GraduationCap className="h-4 w-4" />}
                    />
                    <NavigationTab
                      label="Attendance"
                      to="/attendance"
                      isActive={currentPath === "attendance"}
                      icon={<CalendarCheck className="h-4 w-4" />}
                    />
                    <NavigationTab
                      label="Leave"
                      to="/leaves"
                      isActive={currentPath === "leaves"}
                      icon={<CalendarClock className="h-4 w-4" />}
                    />
                    <NavigationTab
                      label="Daily Tasks"
                      to="/daily_tasks"
                      isActive={currentPath === "daily_tasks"}
                      icon={<ClipboardList className="h-4 w-4" />}
                    />
                  </>
                ) : (
                  // Employee nav — flat tabs, no dropdown
                  <>
                    <NavigationTab
                      label="Attendance"
                      to="/attendance"
                      isActive={currentPath === "attendance"}
                      icon={<CalendarCheck className="h-4 w-4" />}
                    />
                    <NavigationTab
                      label="Leave"
                      to="/leaves"
                      isActive={currentPath === "leaves"}
                      icon={<CalendarClock className="h-4 w-4" />}
                    />
                    <NavigationTab
                      label="Daily Tasks"
                      to="/daily_tasks"
                      isActive={currentPath === "daily_tasks"}
                      icon={<ClipboardList className="h-4 w-4" />}
                    />
                  </>
                )}
              </nav>
            </div>

            {/* Right controls */}
            <div className="flex items-center">
              <ThemeModeToggle />
              <RefreshButton />
              <UserMenu>
                <ProfileMenu />
                <CanAccess resource="sales" action="list">
                  <UsersMenu />
                </CanAccess>
                <CanAccess resource="configuration" action="edit">
                  <SettingsMenu />
                </CanAccess>
                <ChangelogMenuItem />
              </UserMenu>
            </div>
          </div>
        </div>
      </header>
    </nav>
  );
};

const NavigationTab = ({
  label,
  to,
  isActive,
  icon,
}: {
  label: string;
  to: string;
  isActive: boolean;
  icon?: React.ReactNode;
}) => (
  <Link
    to={to}
    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
      isActive
        ? "text-secondary-foreground border-blue-600"
        : "text-secondary-foreground/70 border-transparent hover:text-secondary-foreground/80"
    }`}
  >
    {icon}
    {label}
  </Link>
);

const UsersMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext)
    throw new Error("<UsersMenu> must be used inside <UserMenu>");
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/sales" className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        {translate("resources.sales.name", { smart_count: 2 })}
      </Link>
    </DropdownMenuItem>
  );
};

const ProfileMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext)
    throw new Error("<ProfileMenu> must be used inside <UserMenu>");
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/profile" className="flex items-center gap-2">
        <User className="h-4 w-4" />
        {translate("crm.profile.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const SettingsMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext)
    throw new Error("<SettingsMenu> must be used inside <UserMenu>");
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/settings" className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        {translate("crm.settings.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const ChangelogMenuItem = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext)
    throw new Error("<ChangelogMenuItem> must be used inside <UserMenu>");
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to={ChangelogPage.path} className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        {translate("crm.changelog.title")}
      </Link>
    </DropdownMenuItem>
  );
};

export default Header;
