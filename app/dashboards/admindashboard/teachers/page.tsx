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
  
  // FIXED: Point to your deployed backend
  const API_BASE_URL = "https://pariksha-9qjs.onrender.com/api/dashboards/admindashboard/teacher";

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [department, setDepartment] = useState<string>("Computer Science");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editDept, setEditDept] = useState<string>("");

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    if (!name || role !== "admin") {
      router.push("/");
      return;
    }
    fetchTeachers();
  }, [router]);

  const fetchTeachers = async () => {
    try {
      const res = await fetch(API_BASE_URL);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error("Failed to load records:", err);
    }
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
        const errData = await res.json();
        setStatusMsg({ type: "error", text: errData.detail || "Failed insertion execution." });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "Connection error: Check if the backend is online." });
    }
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
        setStatusMsg({ type: "success", text: "Faculty profile details updated successfully." });
        fetchTeachers();
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to update profile.");
      }
    } catch (err) {
      alert("Update operation failed.");
    }
  };

  const handleRemoveTeacher = async (teacherId: number) => {
    if (!confirm("Are you sure you want to scrub this faculty member?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}?id=${teacherId}`, { method: "DELETE" });
      if (res.ok) {
        fetchTeachers();
      }
    } catch (err) {
      alert("Delete operation failure.");
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    (teacher.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (teacher.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (teacher.department?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-[#111827] uppercase tracking-wide m-0">TEACHER DIRECTORY CONTROL SYSTEM</h2>
          <p className="text-xs text-gray-500 m-0 mt-1">Add, Remove and Edit teachers details.</p>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-bold border mt-4 ${
          statusMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {statusMsg.type === "success" ? "✅" : "⚠️"} {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-4 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-400 tracking-wider uppercase m-0 mb-5">Add New Faculty Profile</h3>
          <form onSubmit={handleManualInsertSubmit} className="flex flex-col gap-4">
            <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
            <input type="email" placeholder="Email Address" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm cursor-pointer">
              <option value="Computer Science">Computer Science</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Natural Sciences">Natural Sciences</option>
            </select>
            <button type="submit" className="w-full bg-[#4F46E5] text-white text-xs font-bold py-3.5 rounded-xl">+ Insert Into Directory</button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl lg:col-span-8 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 Search records..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs" />
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 text-[11px] font-extrabold uppercase bg-gray-50/30">
                <th className="py-3 px-5">S.N.</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Dept</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((t, i) => (
                <tr key={t.id} className="hover:bg-gray-50/60">
                  <td className="py-3 px-5 text-xs text-gray-400">{i + 1}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{t.name}</td>
                  <td className="py-3 px-4 text-xs">{t.email}</td>
                  <td className="py-3 px-4 text-[10px] font-bold text-indigo-700 bg-indigo-50 rounded uppercase">{t.department}</td>
                  <td className="py-3 px-4 text-center flex justify-center gap-3">
                    <button onClick={() => startEdit(t)} className="text-indigo-600 text-xs font-bold uppercase">Edit</button>
                    <button onClick={() => handleRemoveTeacher(t.id)} className="text-red-500 text-xs font-bold uppercase">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-base font-extrabold mb-4">Edit Faculty Details</h3>
            <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4">
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border p-2 rounded-xl" required />
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full border p-2 rounded-xl" required />
              <button type="submit" className="bg-indigo-600 text-white p-2 rounded-xl">Save Changes</button>
              <button type="button" onClick={() => setEditingTeacher(null)} className="bg-gray-100 p-2 rounded-xl">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}