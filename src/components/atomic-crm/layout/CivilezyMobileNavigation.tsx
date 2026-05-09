import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { useGetIdentity } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";

const NavBtn = ({
  href,
  Icon,
  label,
  isActive,
}: {
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  isActive: boolean;
}) => (
  <Button
    asChild
    variant="ghost"
    className={cn(
      "flex-col gap-1 h-auto py-2 px-1 rounded-md w-16",
      !isActive && "text-muted-foreground",
    )}
  >
    <Link to={href}>
      <Icon className="size-5" />
      <span className="text-[0.6rem] font-medium leading-none">{label}</span>
    </Link>
  </Button>
);

const EmployeeMobileNav = () => {
  const { pathname } = useLocation();
  const at = (p: string) =>
    p === "/" ? !!matchPath("/", pathname) : !!matchPath(`${p}/*`, pathname);

  return (
    <div className="flex justify-around w-full">
      <NavBtn href="/" Icon={Home} label="Home" isActive={at("/")} />
      <NavBtn
        href="/attendance"
        Icon={CalendarCheck}
        label="Attendance"
        isActive={at("/attendance")}
      />
      <NavBtn
        href="/leaves"
        Icon={CalendarClock}
        label="Leave"
        isActive={at("/leaves")}
      />
      <NavBtn
        href="/daily_tasks"
        Icon={ClipboardList}
        label="Tasks"
        isActive={at("/daily_tasks")}
      />
      <NavBtn
        href="/profile"
        Icon={Settings}
        label="Profile"
        isActive={at("/profile")}
      />
    </div>
  );
};

const AdminMobileNav = () => {
  const { pathname } = useLocation();
  const at = (p: string) =>
    p === "/" ? !!matchPath("/", pathname) : !!matchPath(`${p}/*`, pathname);

  return (
    <div className="flex justify-around w-full">
      <NavBtn
        href="/"
        Icon={LayoutDashboard}
        label="Dashboard"
        isActive={at("/")}
      />
      <NavBtn
        href="/students"
        Icon={GraduationCap}
        label="Leads"
        isActive={at("/students")}
      />
      <NavBtn
        href="/attendance"
        Icon={CalendarCheck}
        label="Attendance"
        isActive={at("/attendance")}
      />
      <NavBtn
        href="/leaves"
        Icon={CalendarClock}
        label="Leaves"
        isActive={at("/leaves")}
      />
      <NavBtn
        href="/settings"
        Icon={Settings}
        label="Settings"
        isActive={at("/settings")}
      />
    </div>
  );
};

const isPwa = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(display-mode: standalone)").matches;
const isWebiOS = () =>
  typeof window !== "undefined" &&
  /iPad|iPod|iPhone/.test(window.navigator.userAgent);

export const CivilezyMobileNavigation = () => {
  const { identity, isPending } = useGetIdentity();

  const pwaIOS = isPwa() && isWebiOS();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t"
      style={{
        paddingBottom: pwaIOS ? 15 : undefined,
        height: pwaIOS ? "calc(3.5rem + 15px)" : "3.5rem",
      }}
    >
      {!isPending &&
        (identity?.administrator === true ? (
          <AdminMobileNav />
        ) : (
          <EmployeeMobileNav />
        ))}
    </nav>
  );
};
