"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Teacher {
  id: number;
  name: string;
  email: string;
  department: string;
}

export default function TeachersManagement() {
  const router = useRouter();
  
  const API_BASE_URL = "https://pariksha-9qjs.onrender.com/api/dashboards/admindashboard/teachers";
  // Assuming this is your endpoint for fetching the dynamic list of departments
  const DEPT_API_URL = "https://pariksha-9qjs.onrender.com/api/departments";

  // View States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Modal States
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editDept, setEditDept] = useState<string>("");

  // Initial Data Load
  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    if (!name || role !== "admin") {
      router.push("/");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    await fetchTeachers();
    await fetchDepartments();
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch(API_BASE_URL);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (err) { console.error("Failed to load records:", err); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(DEPT_API_URL);
      if (res.ok) {
        const data = await res.json();
        setAvailableDepartments(data);
        if (data.length > 0) setDepartment(data[0]); // Default to first item
      }
    } catch (err) { console.error("Failed to load departments:", err); }
  };

  const handleManualInsertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email: emailAddress, department }),
      });
      if (res.ok) {
        setStatusMsg({ type: "success", text: "Faculty profile recorded successfully." });
        setFullName("");
        setEmailAddress("");
        fetchTeachers(); 
      } else {
        const errData = await res.json().catch(() => ({ detail: "Failed insertion." }));
        setStatusMsg({ type: "error", text: errData.detail || "Failed insertion." });
      }
    } catch (err) { setStatusMsg({ type: "error", text: "Connection error." }); }
  };

  const startEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name);
    setEditEmail(teacher.email);
    setEditDept(teacher.department);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      const res = await fetch(`${API_BASE_URL}?id=${editingTeacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail, department: editDept }),
      });
      if (res.ok) {
        setEditingTeacher(null);
        fetchTeachers();
      }
    } catch (err) { console.error("Update error:", err); }
  };

  const handleRemoveTeacher = async (teacherId: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}?id=${teacherId}`, { method: "DELETE" });
      if (res.ok) fetchTeachers();
    } catch (err) { console.error("Delete failure:", err); }
  };

  const filteredTeachers = teachers.filter((t) => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* (Keep your Header and Feedback UI as is) */}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-4 shadow-sm">
          <form onSubmit={handleManualInsertSubmit} className="flex flex-col gap-4">
            {/* Name/Email inputs omitted for brevity, keep as original */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">Assigned Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white cursor-pointer">
                {availableDepartments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full mt-2 bg-[#4F46E5] text-white text-xs font-bold py-3.5 rounded-xl">Insert</button>
          </form>
        </div>

        {/* (Keep Data Directory Table as is) */}
      </div>

      {/* Edit Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4">
              {/* ... name/email inputs ... */}
              <select value={editDept} onChange={(e) => setEditDept(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5">
                {availableDepartments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
              </select>
              <button type="submit">Save</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}