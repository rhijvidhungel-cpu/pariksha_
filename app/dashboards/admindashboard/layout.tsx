"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); 

  const [adminName, setAdminName] = useState<string>("Master Admin");
  const [adminEmail, setAdminEmail] = useState<string>("admin@ku.edu.np");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  // Notification form state
  const [notifType, setNotifType] = useState("all_students");
  const [notifTargetId, setNotifTargetId] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  // Search state for dropdowns
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "admin") {
      router.replace("/");
      return;
    }

    setAdminName(name);
    setIsVerified(true);

    const email = localStorage.getItem("email") || name;
    setAdminEmail(email);
    
    loadNotifications();
    loadTeachers();
    loadStudents();
    loadBatches();
    loadDepartments();
  }, [pathname, router]);

  async function loadNotifications() {
    try {
      const res = await fetch("https://pariksha-9qjs.onrender.com/api/notifications");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    }
  }

  async function loadTeachers() {
    try {
      const res = await fetch("https://pariksha-9qjs.onrender.com/api/dashboards/admindashboard/teachers");
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch {
      setTeachers([]);
    }
  }

  async function loadStudents() {
    try {
      const res = await fetch("https://pariksha-9qjs.onrender.com/api/students");
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      setStudents([]);
    }
  }

  async function loadBatches() {
    try {
      const res = await fetch("https://pariksha-9qjs.onrender.com/api/batches");
      const data = await res.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch {
      setBatches([]);
    }
  }

  async function loadDepartments() {
    try {
      const res = await fetch("https://pariksha-9qjs.onrender.com/api/departments");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDepartments(data.map((d: any) => d.department_name || d));
      } else {
        setDepartments([]);
      }
    } catch {
      setDepartments([]);
    }
  }

  function getTargetLabel(notif: any): string {
    // Resolve student/teacher IDs to usernames
    let targetLabel = notif.target_id || "N/A";
    if (notif.type === "single_student") {
      const found = students.find((s: any) => String(s.sn || s.student_id) === String(notif.target_id));
      if (found) targetLabel = found.name || found.full_name || targetLabel;
    } else if (notif.type === "single_teacher") {
      const found = teachers.find((t: any) => String(t.user_id) === String(notif.target_id));
      if (found) targetLabel = found.name || targetLabel;
    }

    const typeLabels: Record<string, string> = {
      "all_students": "All Students",
      "all_teachers": "All Teachers",
      "batch_students": `Batch: ${notif.target_id || "N/A"}`,
      "department_students": `Dept (Students): ${notif.target_id || "N/A"}`,
      "department_teachers": `Dept (Teachers): ${notif.target_id || "N/A"}`,
      "single_student": `Student: ${targetLabel}`,
      "single_teacher": `Teacher: ${targetLabel}`,
    };
    return typeLabels[notif.type] || notif.type || "Notice";
  }

  async function sendNotification() {
    if (!notifMessage.trim()) {
      alert("Please enter a notification message.");
      return;
    }
    try {
      const payload: any = {
        type: notifType,
        message: notifMessage,
      };
      if (notifTargetId) {
        payload.target_id = notifTargetId;
      }
      const res = await fetch("https://pariksha-9qjs.onrender.com/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send notification");
      alert("Notification sent successfully!");
      setShowNotificationModal(false);
      setNotifMessage("");
      setNotifTargetId("");
      loadNotifications();
    } catch (err: any) {
      alert(err.message);
    }
  }

  const getNavClass = (targetPath: string) => {
    const baseClass = "flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all text-left w-full border-none bg-transparent cursor-pointer ";
    const isActive = pathname === targetPath;
    
    if (isActive) {
      return baseClass + "font-bold text-white bg-[#4F46E5] shadow-md";
    }
    return baseClass + "font-medium text-[#C7D2FE] hover:bg-white/5";
  };

  // Filtered students/teachers based on search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter((s: any) => 
      (s.name || s.full_name || "").toLowerCase().includes(q) ||
      (s.roll || s.username || "").toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const filteredTeachers = useMemo(() => {
    if (!teacherSearch.trim()) return teachers;
    const q = teacherSearch.toLowerCase();
    return teachers.filter((t: any) => 
      (t.name || "").toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch]);

  // Format date/time nicely in Nepal Time (Asia/Katmandu)
  function formatDateTime(dateStr: string): string {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        timeZone: "Asia/Katmandu",
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: true
      });
    } catch {
      return dateStr;
    }
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
            <button onClick={() => router.push("/dashboards/admindashboard/academic-structure")} className={getNavClass("/dashboards/admindashboard/academic-structure")}>
              <span className="text-base">AS</span> <span>Academic Structure</span>
            </button>
            <button onClick={() => router.push("/dashboards/admindashboard/students")} className={getNavClass("/dashboards/admindashboard/students")}>
              <span className="text-base">🎓</span> <span>Students Directory</span>
            </button>
            <button onClick={() => router.push("/dashboards/admindashboard/teachers")} className={getNavClass("/dashboards/admindashboard/teachers")}>
              <span className="text-base">👥</span> <span>Teachers Management</span>
            </button>
            <button onClick={() => router.push("/dashboards/admindashboard/classrooms")} className={getNavClass("/dashboards/admindashboard/classrooms")}>
              <span className="text-base">🏛️</span> <span>Classroom Management</span>
            </button>
            <button onClick={() => router.push("/dashboards/admindashboard/exam_routine")} className={getNavClass("/dashboards/admindashboard/exam_routine")}>
              <span className="text-base">📅</span> <span>Upload Exam Routine</span>
            </button>
            <button onClick={() => router.push("/dashboards/admindashboard/allocation")} className={getNavClass("/dashboards/admindashboard/seat-allocation")}>
              <span className="text-base">🔀</span> <span>Seat Allocation Engine</span>
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowNotificationModal(true)}
            className="flex items-center justify-center gap-2 w-full bg-indigo-500/10 border border-indigo-500/20 text-[#A5B4FC] rounded-lg py-2.5 text-xs font-medium hover:bg-indigo-500/20 transition-colors cursor-pointer"
          >
            🔔 Send Notification
          </button>
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
              <p className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wider m-0">Admin's Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            {/* Notification Bell with Dropdown */}
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
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-96 overflow-y-auto z-50">
                  <div className="p-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-[#111827]">Notifications ({notifications.length})</h3>
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((notif: any, idx: number) => (
                      <div key={idx} className="p-3 border-b border-slate-50 hover:bg-slate-50">
                        <p className="text-xs text-[#4F46E5] font-semibold uppercase">{getTargetLabel(notif)}</p>
                        <p className="text-sm text-[#111827] mt-1">{notif.message}</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-1">{formatDateTime(notif.created_at)}</p>
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

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-[#111827]">Send Notification</h2>
              <button
                onClick={() => { setShowNotificationModal(false); setNotifTargetId(""); setNotifMessage(""); setTeacherSearch(""); setStudentSearch(""); }}
                className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Send To</label>
                <select
                  value={notifType}
                  onChange={(e) => { setNotifType(e.target.value); setNotifTargetId(""); setTeacherSearch(""); setStudentSearch(""); }}
                  className="w-full border border-gray-400 rounded-lg px-4 py-3 text-sm text-gray-900 font-medium outline-none focus:border-indigo-500"
                >
                  <option value="all_students">All Students</option>
                  <option value="all_teachers">All Teachers</option>
                  <option value="batch_students">Specific Batch (Students)</option>
                  <option value="department_students">Specific Department (Students)</option>
                  <option value="department_teachers">Specific Department (Teachers)</option>
                  <option value="single_student">Individual Student</option>
                  <option value="single_teacher">Individual Teacher</option>
                </select>
              </div>

              {(notifType === "batch_students") && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Select Batch</label>
                  <select
                    value={notifTargetId}
                    onChange={(e) => setNotifTargetId(e.target.value)}
                    className="w-full border border-gray-400 rounded-lg px-4 py-3 text-sm text-gray-900 font-medium outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a batch</option>
                    {batches.map((b: string) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {(notifType === "department_students" || notifType === "department_teachers") && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Select Department</label>
                  <select
                    value={notifTargetId}
                    onChange={(e) => setNotifTargetId(e.target.value)}
                    className="w-full border border-gray-400 rounded-lg px-4 py-3 text-sm text-gray-900 font-medium outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a department</option>
                    {departments.map((d: string) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              {notifType === "single_student" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Select Student</label>
                  {/* Search bar for students */}
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="🔍 Search student by name or roll..."
                    className="w-full border border-gray-400 rounded-lg px-4 py-2.5 text-sm text-gray-900 font-medium outline-none focus:border-indigo-500 mb-2"
                  />
                  <select
                    value={notifTargetId}
                    onChange={(e) => setNotifTargetId(e.target.value)}
                    className="w-full border border-gray-400 rounded-lg px-4 py-3 text-sm text-gray-900 font-medium outline-none focus:border-indigo-500"
                    size={Math.min(filteredStudents.length + 1, 6)}
                  >
                    <option value="">Select a student</option>
                    {filteredStudents.map((s: any) => (
                      <option key={s.sn || s.student_id} value={String(s.sn || s.student_id)}>
                        {s.name || s.full_name} ({s.roll || s.username})
                      </option>
                    ))}
                  </select>
                  {studentSearch && (
                    <p className="text-xs text-gray-500 mt-1">{filteredStudents.length} student(s) found</p>
                  )}
                </div>
              )}

              {notifType === "single_teacher" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Select Teacher</label>
                  {/* Search bar for teachers */}
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="🔍 Search teacher by name or email..."
                    className="w-full border border-gray-400 rounded-lg px-4 py-2.5 text-sm text-gray-900 font-medium outline-none focus:border-indigo-500 mb-2"
                  />
                  <select
                    value={notifTargetId}
                    onChange={(e) => setNotifTargetId(e.target.value)}
                    className="w-full border border-gray-400 rounded-lg px-4 py-3 text-sm text-gray-900 font-medium outline-none focus:border-indigo-500"
                    size={Math.min(filteredTeachers.length + 1, 6)}
                  >
                    <option value="">Select a teacher</option>
                    {filteredTeachers.map((t: any) => (
                      <option key={t.user_id} value={String(t.user_id)}>{t.name} ({t.email})</option>
                    ))}
                  </select>
                  {teacherSearch && (
                    <p className="text-xs text-gray-500 mt-1">{filteredTeachers.length} teacher(s) found</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Message</label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Type your notification message here..."
                  rows={4}
                  className="w-full border border-gray-400 rounded-lg px-4 py-3 text-sm text-gray-900 font-medium outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                onClick={sendNotification}
                className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg py-3 text-sm font-bold transition-colors"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}