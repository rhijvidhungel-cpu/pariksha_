"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); // Reads the active URL route instantly from NextJS engine

  const [adminName, setAdminName] = useState<string>("Master Admin");
  const [adminEmail, setAdminEmail] = useState<string>("root@ku.edu.np");

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    // Unified security routing checkpoint
    if (!name || role !== "admin") {
      router.push("/");
      return;
    }

    setAdminName(name);
    const email = localStorage.getItem("email");
    if (email) setAdminEmail(email);
  }, [router]);

  // Evaluates which path tab highlights based on current URL location
  const getNavClass = (targetPath: string) => {
    const baseClass = "flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all text-left w-full border-none bg-transparent cursor-pointer ";
    
    // Checks if exact match, or if it belongs to a nested route system
    const isActive = pathname === targetPath;
    
    if (isActive) {
      return baseClass + "font-bold text-white bg-[#4F46E5] shadow-md";
    }
    return baseClass + "font-medium text-[#C7D2FE] hover:bg-white/5";
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      
      {/* SIDEBAR PANEL */}
      <aside className="w-[260px] bg-[#2E1A47] text-white flex flex-col justify-between p-6 fixed top-0 left-0 h-screen shrink-0 shadow-xl z-10 select-none">
        <div className="flex flex-col gap-6">
          <div className="pb-6 border-b border-white/10 mb-2">
            <h1 className="text-[22px] font-extrabold tracking-wide m-0 bg-gradient-to-r from-[#6366F1] to-[#80f755] bg-clip-text text-transparent">
              PARIKSHA
            </h1>
            <p className="text-[10px] text-[#A5B4FC] font-semibold tracking-wider mt-1 uppercase m-0">Admin Control Desk</p>
          </div>
          
          <nav className="flex flex-col gap-2">
            <button onClick={() => router.push("/dashboards/admindashboard")} className={getNavClass("/dashboards/admindashboard")}>
              <span className="text-base">📊</span> <span>Dashboard Summary</span>
            </button>
            <button onClick={() => router.push("/dashboards/admindashboard/students")} className={getNavClass("/dashboards/admindashboard/students")}>
              <span className="text-base">🎓</span> <span>Students Directory</span>
            </button>
            <button onClick={() => router.push("/dashboards/admindashboard/teachers")} className={getNavClass("/dashboards/admindashboard/teachers")}>
              <span className="text-base">👥</span> <span>Teachers Management</span>
            </button>
            <button onClick={() => router.push("/admin/classrooms")} className={getNavClass("/admin/classrooms")}>
              <span className="text-base">🏛️</span> <span>Classroom Management</span>
            </button>
            <button onClick={() => router.push("/admin/routine")} className={getNavClass("/admin/routine")}>
              <span className="text-base">📅</span> <span>Upload Exam Routine</span>
            </button>
            <button onClick={() => router.push("/admin/seat-allocation")} className={getNavClass("/admin/seat-allocation")}>
              <span className="text-base">🔀</span> <span>Seat Allocation Engine</span>
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-3">
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
              <p className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wider m-0">Admin's Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <button className="relative p-1.5 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer" aria-label="Alert Registers">
              <span className="absolute top-[6px] right-[6px] w-2 h-2 rounded-full bg-[#4F46E5] border-2 border-white"></span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            <div className="w-px h-7 bg-[#E5E7EB]" />

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EEF2F6] flex items-center justify-center text-[#4F46E5] font-bold text-sm border border-gray-100">
                🛡️
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <p className="text-[13px] font-bold text-[#111827] leading-tight m-0">{adminName}</p>
                <p className="text-[11px] text-[#6B7280] m-0 font-normal mt-0.5">{adminEmail}</p>
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