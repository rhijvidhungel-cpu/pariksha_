"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Teacher {
  id: number;
  user_id: number;
  name: string;
  email: string;
  department: string;
}

interface Department {
  department_id: number;
  department_name: string;
}

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const API_ROOT =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://pariksha-9qjs.onrender.com";
const TEACHERS_API_URL = `${API_ROOT}/api/dashboards/admindashboard/teachers`;
const DEPARTMENTS_API_URL = `${API_ROOT}/api/departments`;

export default function TeachersManagement() {
  const router = useRouter();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDept, setEditDept] = useState("");

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(TEACHERS_API_URL);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to load teachers.");
      }

      setTeachers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: getErrorMessage(err, "Failed to load teacher records."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch(DEPARTMENTS_API_URL);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to load departments.");
      }

      const nextDepartments = Array.isArray(data) ? data : [];
      setDepartments(nextDepartments);
      setDepartment((prev) => prev || nextDepartments[0]?.department_name || "");
      setEditDept((prev) => prev || nextDepartments[0]?.department_name || "");
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: getErrorMessage(err, "Failed to load department options."),
      });
    }
  }, []);

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "admin") {
      router.push("/");
      return;
    }

    queueMicrotask(() => {
      void fetchTeachers();
      void fetchDepartments();
    });
  }, [fetchDepartments, fetchTeachers, router]);

  const handleManualInsertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    try {
      const res = await fetch(TEACHERS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: emailAddress.trim().toLowerCase(),
          department,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to add teacher.");
      }

      setStatusMsg({
        type: "success",
        text: "Teacher added to teachers table and users table.",
      });
      setFullName("");
      setEmailAddress("");
      await fetchTeachers();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: getErrorMessage(err, "Backend server connection issue."),
      });
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
      const res = await fetch(`${TEACHERS_API_URL}?id=${editingTeacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          department: editDept,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to update teacher.");
      }

      setEditingTeacher(null);
      setStatusMsg({
        type: "success",
        text: "Teacher updated in teachers table and users table.",
      });
      await fetchTeachers();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: getErrorMessage(err, "Failed to update teacher."),
      });
    }
  };

  const handleRemoveTeacher = async (teacherId: number) => {
    if (!confirm("Remove this teacher from teachers table and users table?")) {
      return;
    }

    try {
      const res = await fetch(`${TEACHERS_API_URL}?id=${teacherId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to delete teacher.");
      }

      setStatusMsg({
        type: "success",
        text: "Teacher deleted from teachers table and users table.",
      });
      await fetchTeachers();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: getErrorMessage(err, "Delete operation failed."),
      });
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      (teacher.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (teacher.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (teacher.department?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-[#111827] uppercase tracking-wide m-0">
            TEACHER DIRECTORY CONTROL SYSTEM
          </h2>
          <p className="text-xs text-gray-500 m-0 mt-1">
            Add, remove and edit teacher details.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-bold border mt-4 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-4 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-400 tracking-wider uppercase m-0 mb-5">
            Add New Faculty Profile Manually
          </h3>
          <form onSubmit={handleManualInsertSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Full Teacher Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Assigned Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 cursor-pointer"
                required
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.department_id} value={dept.department_name}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-[#4F46E5] text-white text-xs font-bold py-3.5 rounded-xl cursor-pointer"
            >
              + Insert Into Directory Registry
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl lg:col-span-8 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teacher records..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse m-0">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 text-[11px] font-extrabold uppercase bg-gray-50/30">
                  <th className="py-3 px-5 text-center">S.N.</th>
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Email / Username</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center w-[140px]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-gray-400 font-mono">
                      Loading teacher records...
                    </td>
                  </tr>
                ) : filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher, index) => (
                    <tr key={teacher.id || index} className="hover:bg-gray-50/60">
                      <td className="py-3 px-5 font-mono text-xs text-gray-400 text-center">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {teacher.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">
                        {teacher.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-extrabold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 uppercase">
                          {teacher.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center flex justify-center gap-3">
                        <button
                          onClick={() => startEdit(teacher)}
                          className="bg-transparent border-none text-indigo-600 hover:text-indigo-900 text-xs font-extrabold cursor-pointer uppercase"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveTeacher(teacher.id)}
                          className="bg-transparent border-none text-red-500 hover:text-red-700 text-xs font-extrabold cursor-pointer uppercase"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-gray-400 font-mono">
                      No matching teacher records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl mx-4">
            <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wide mb-4">
              Edit Faculty Details
            </h3>

            <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Full Teacher Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Email Address / Username
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Assigned Department
                </label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 cursor-pointer"
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_name}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
