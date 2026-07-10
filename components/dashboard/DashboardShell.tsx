"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface DashboardShellProps {
  role: "admin" | "student" | "teacher";
  portalLabel: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

const ROLE_CONFIG = {
  admin: { subtitle: "Admin Control Desk", avatar: "🛡️", portalTitle: "Admin's Portal" },
  student: { subtitle: "Student Portal", avatar: "🎓", portalTitle: "Student Portal" },
  teacher: { subtitle: "Teacher Portal", avatar: "👨‍🏫", portalTitle: "Teacher Portal" },
};

export default function DashboardShell({
  role,
  portalLabel,
  navItems,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const config = ROLE_CONFIG[role];

  useEffect(() => {
    const name = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");

    if (!name || storedRole !== role) {
      router.replace("/");
      return;
    }

    setUserName(name);
    setUserEmail(localStorage.getItem("email") || name);
    setIsVerified(true);
  }, [pathname, router, role]);

  function getNavClass(href: string) {
    const base =
      "flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all text-left w-full border-none bg-transparent cursor-pointer ";
    const isActive = pathname === href || (href !== `/dashboards/${role}dashboard` && pathname.startsWith(href));
    if (isActive) return base + "font-bold text-white bg-[#4F46E5] shadow-md";
    return base + "font-medium text-[#C7D2FE] hover:bg-white/5";
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-[#2E1A47] flex items-center justify-center text-white font-medium">
        Verifying Security Credentials...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <aside className="w-[260px] bg-[#2E1A47] text-white flex flex-col justify-between p-6 fixed top-0 left-0 h-screen shrink-0 shadow-xl z-10 select-none">
        <div className="flex flex-col gap-6">
          <div className="pb-6 border-b border-white/10 mb-2">
            <h1 className="text-[22px] font-extrabold tracking-wide m-0 bg-gradient-to-r from-[#6366F1] to-[#80f755] bg-clip-text text-transparent">
              PARIKSHA
            </h1>
            <p className="text-[10px] text-[#A5B4FC] font-semibold tracking-wider mt-1 uppercase m-0">
              {config.subtitle}
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={getNavClass(item.href)}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => router.push("/change-password?voluntary=true")}
              className={getNavClass("/change-password")}
            >
              <span className="text-base">🔑</span>
              <span>Change Password</span>
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              router.push("/");
            }}
            className="flex items-center justify-center gap-2 w-full bg-red-500/10 border border-red-500/20 text-[#FCA5A5] rounded-lg py-2.5 text-xs font-medium hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            🚪 Log out
          </button>
          <div className="text-[11px] text-[#818CF8]/60 font-mono pl-2">v2.2.0-2026</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col pl-[260px] min-w-0">
        <header className="h-[70px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 sticky top-0 z-50">
          <div>
            <h2 className="text-base font-extrabold text-[#111827] uppercase tracking-wide m-0">PARIKSHA</h2>
            <p className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wider m-0">{portalLabel}</p>
          </div>

          <div className="flex items-center gap-5">
            <NotificationBell />
            <div className="w-px h-7 bg-[#E5E7EB]" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] font-bold text-sm border border-gray-100">
                {config.avatar}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <p className="text-[13px] font-bold text-[#111827] leading-tight m-0">{userName}</p>
                <p className="text-[11px] text-[#6B7280] m-0 font-normal mt-0.5">{userEmail}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8 flex flex-col gap-6 w-full max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
