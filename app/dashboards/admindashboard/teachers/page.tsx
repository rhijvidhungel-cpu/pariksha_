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
  const API_BASE_URL = "https://pariksha-9qjs.onrender.com/api/dashboards/admindashboard/teacher";
  const DEPARTMENTS_URL = "https://pariksha-9qjs.onrender.com/api/departments";

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
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
    fetchDepartments();
  }, [router]);

  const fetchTeachers = async () => {
    try {
      const res = await fetch(API_BASE_URL);
      if (res.ok) setTeachers(await res.json());
    } catch (err) { console.error("Failed to load records:", err); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(DEPARTMENTS_URL);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
        if (data.length > 0) setDepartment(data[0]);
      }
    } catch (err) { console.error("Failed to fetch departments:", err); }
  };

  const handleManualInsertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email: emailAddress, department }),
      });
      if (res.ok) {
        setStatusMsg({ type: "success", text: "Recorded successfully." });
        setFullName("");
        setEmailAddress("");
        fetchTeachers();
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
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <form onSubmit={handleManualInsertSubmit}>
        {/* ... your inputs ... */}
        <button type="submit">Submit</button>
      </form>
      {/* ... rest of your UI ... */}
    </>
  );
}