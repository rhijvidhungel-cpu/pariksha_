"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChangePasswordModal from "../../components/ChangePasswordModal";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState<string>("Teacher");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; message: string; date: string }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "teacher") {
      router.replace("/");
      return;
    }

    setTeacherName(name);
    setIsVerified(true);
    
    fetchNotifications();
  }, [router]);

  const fetchNotifications = async () => {
    try {
      const apiBaseUrl = "https://pariksha-9qjs.onrender.com";
      const res = await fetch(`${apiBaseUrl}/api/notifications/teacher`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
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
      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#2E1A47] text-white flex flex-col justify-between p-6 fixed top-0 left-0 h-screen shrink-0 shadow-xl z-10 select-none">
        <div className="flex flex-col gap-6">
          <div className="pb-6 border-b border-white/10 mb-2">
            <h1 className="text-[22px] font-extrabold tracking-wide m-0 bg-gradient-to-r from-[#6366F1] to-[#80f755] bg-clip-text text-transparent">
              PARIKSHA
            </h1>
            <p className="text-[10px] text-[#A5B4FC] font-semibold tracking-wider mt-1 uppercase m-0">Teacher Portal</p>
          </div>

          <nav className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/dashboards/teacherdashboard")}
              className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all text-left w-full border-none bg-transparent cursor-pointer font-medium text-[#C7D2FE] hover:bg-white/5"
            >
              <span className="text-base">📚</span> <span>Dashboard</span>
            </button>
            <button
              onClick={() => router.push("/dashboards/teacherdashboard/hall-view")}
              className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all text-left w-full border-none bg-transparent cursor-pointer font-medium text-[#C7D2FE] hover:bg-white/5"
            >
              <span className="text-base">🎭</span> <span>Hall View</span>
            </button>
            <button
              onClick={() => router.push("/dashboards/teacherdashboard/attendance")}
              className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all text-left w-full border-none bg-transparent cursor-pointer font-medium text-[#C7D2FE] hover:bg-white/5"
            >
              <span className="text-base">📋</span> <span>Attendance</span>
            </button>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all text-left w-full border-none bg-transparent cursor-pointer font-medium text-[#C7D2FE] hover:bg-white/5 relative"
            >
              <span className="text-base">🔔</span>
              <span>Notifications</span>
              {notifications.length > 0 && (
                <span className="absolute right-4 top-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center justify-center gap-2 w-full border border-[#818CF8]/40 text-[#C7D2FE] rounded-lg py-2.5 text-xs font-medium hover:bg-white/5 transition-colors bg-transparent"
          >
            🔐 Change Password
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/");
            }}
            className="flex items-center justify-center gap-2 w-full bg-red-500/10 border border-red-500/20 text-[#FCA5A5] rounded-lg py-2.5 text-xs font-medium hover:bg-red-500/20 transition-colors"
          >
            🚪 Log out
          </button>
          <div className="text-[11px] text-[#818CF8]/60 font-mono pl-2">
            v2.1.0-2026-Prod
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col pl-[260px] min-w-0">
        {/* HEADER */}
        <header className="h-[70px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-base font-extrabold text-[#111827] uppercase tracking-wide m-0">PARIKSHA</h2>
              <p className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wider m-0">Teacher Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-9 h-9 rounded-full bg-[#EEF2F6] flex items-center justify-center text-[#4F46E5] font-bold text-sm border border-gray-100">
              👨‍🏫
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <p className="text-[13px] font-bold text-[#111827] leading-tight m-0">{teacherName}</p>
              <p className="text-[11px] text-[#6B7280] m-0 font-normal mt-0.5">Teacher</p>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="p-8 flex flex-col gap-6 w-full">
          <div className="flex gap-6">
            <div className="flex-1">
              {children}
            </div>

            {/* NOTIFICATIONS PANEL */}
            {showNotifications && (
              <div className="w-[320px] bg-white rounded-lg shadow-lg border border-[#E5E7EB] p-4 max-h-[600px] overflow-y-auto">
                <h3 className="text-sm font-bold text-[#111827] mb-4">Notifications</h3>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 bg-[#F3F4F6] rounded border border-[#E5E7EB] hover:border-[#4F46E5] transition-colors">
                        <p className="text-xs font-bold text-[#111827] m-0">{notif.title}</p>
                        <p className="text-xs text-[#6B7280] mt-2 m-0">{notif.message}</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-2 m-0">{notif.date}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6B7280] text-center py-4">No new notifications</p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        username={teacherName}
      />
    </div>
  );
}
