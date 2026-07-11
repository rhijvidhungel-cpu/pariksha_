"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [teacherName, setTeacherName] = useState<string>("Teacher");
  const [teacherEmail, setTeacherEmail] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("user_id");

    if (!name || role !== "teacher") {
      router.replace("/");
      return;
    }

    setTeacherName(name);
    setTeacherEmail(name || "");
    setIsVerified(true);

    // Load notifications
    if (userId) {
      fetch(`https://pariksha-9qjs.onrender.com/api/notifications/teacher/${userId}`)
        .then(res => res.json())
        .then(data => setNotifications(Array.isArray(data) ? data : []))
        .catch(() => setNotifications([]));
    }
  }, [pathname, router]);

  const getNavClass = (targetPath: string) => {
    const baseClass = "flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all text-left w-full border-none bg-transparent cursor-pointer ";
    const isActive = pathname === targetPath;
    if (isActive) {
      return baseClass + "font-bold text-white bg-[#4F46E5] shadow-md";
    }
    return baseClass + "font-medium text-[#C7D2FE] hover:bg-white/5";
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-[#2E1A47] flex items-center justify-center text-white font-medium">
        Verifying Security Credentials...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* SIDEBAR PANEL */}
      <aside className="w-[260px] bg-[#2E1A47] text-white flex flex-col justify-between p-6 fixed top-0 left-0 h-screen shrink-0 shadow-xl z-10 select-none">
        <div className="flex flex-col gap-6">
          <div className="pb-6 border-b border-white/10 mb-2">
            <h1 className="text-[22px] font-extrabold tracking-wide m-0 bg-gradient-to-r from-[#6366F1] to-[#80f755] bg-clip-text text-transparent">
              PARIKSHA
            </h1>
            <p className="text-[10px] text-[#A5B4FC] font-semibold tracking-wider mt-1 uppercase m-0">Teacher Portal</p>
          </div>

          <nav className="flex flex-col gap-2">
            <button onClick={() => router.push("/dashboards/teacherdashboard")} className={getNavClass("/dashboards/teacherdashboard")}>
              <span className="text-base">📊</span> <span>Dashboard</span>
            </button>
            <button onClick={() => router.push("/dashboards/teacherdashboard/view_exam_routine")} className={getNavClass("/dashboards/teacherdashboard/view_exam_routine")}>
              <span className="text-base">📅</span> <span>View Exam Routine</span>
            </button>
            <button onClick={() => router.push("/dashboards/teacherdashboard/view_allocated_hall")} className={getNavClass("/dashboards/teacherdashboard/view_allocated_hall")}>
              <span className="text-base">🏛️</span> <span>View Allocated Hall</span>
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/change-password")}
            className="flex items-center justify-center gap-2 w-full bg-indigo-500/10 border border-indigo-500/20 text-[#A5B4FC] rounded-lg py-2.5 text-xs font-medium hover:bg-indigo-500/20 transition-colors cursor-pointer"
          >
            🔑 Change Password
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/");
            }}
            className="flex items-center justify-center gap-2 w-full bg-red-500/10 border border-red-500/20 text-[#FCA5A5] rounded-lg py-2.5 text-xs font-medium hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            🚪 Log out
          </button>
          <div className="text-[11px] text-[#818CF8]/60 font-mono pl-2">
            v2.1.0-2026-Prod
          </div>
        </div>
      </aside>

      {/* CORE FRAME LAYOUT */}
      <div className="flex-1 flex flex-col pl-[260px] min-w-0">
        {/* TOP HEADER PANEL */}
        <header className="h-[70px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-gray-700 p-1 bg-transparent border-none cursor-pointer" aria-label="Menu Toggle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <div>
              <h2 className="text-base font-extrabold text-[#111827] uppercase tracking-wide m-0">PARIKSHA</h2>
              <p className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wider m-0">Teacher's Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer"
                aria-label="Notifications"
              >
                {notifications.length > 0 && (
                  <span className="absolute top-[6px] right-[6px] w-2 h-2 rounded-full bg-[#4F46E5] border-2 border-white"></span>
                )}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-96 overflow-y-auto z-50">
                  <div className="p-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-[#111827]">Notifications</h3>
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((notif: any, idx: number) => (
                      <div key={idx} className="p-3 border-b border-slate-50 hover:bg-slate-50">
                        <p className="text-xs text-[#4F46E5] font-semibold uppercase">{notif.type || "Notice"}</p>
                        <p className="text-sm text-[#111827] mt-1">{notif.message}</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-1">{notif.created_at ? new Date(notif.created_at).toLocaleString() : ""}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-[#9CA3AF] text-center">No notifications yet</div>
                  )}
                </div>
              )}
            </div>

            <div className="w-px h-7 bg-[#E5E7EB]" />

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EEF2F6] flex items-center justify-center text-[#4F46E5] font-bold text-sm border border-gray-100">
                👨‍🏫
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <p className="text-[13px] font-bold text-[#111827] leading-tight m-0">{teacherName}</p>
                <p className="text-[11px] text-[#6B7280] m-0 font-normal mt-0.5">{teacherEmail}</p>
              </div>
            </div>
          </div>
        </header>

        {/* INNER DYNAMIC VIEW AREA */}
        <main className="p-8 flex flex-col gap-6 w-full max-w-[1400px]">
          {children}
        </main>
      </div>
    </div>
  );
}