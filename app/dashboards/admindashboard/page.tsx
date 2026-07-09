"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Batch {
  batch_id: number;
  batch_name: string;
  student_count: number;
}

interface Department {
  department_id: number;
  department_name: string;
  batches: Batch[];
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://pariksha-9qjs.onrender.com";

export default function AdminDashboard() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "admin") {
      router.push("/");
      return;
    }

    queueMicrotask(async () => {
      const res = await fetch(`${API_BASE_URL}/api/departments`).catch(() => null);
      if (!res?.ok) return;
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    });
  }, [router]);

  const totalBatches = departments.reduce((total, dept) => total + dept.batches.length, 0);
  const totalStudents = departments.reduce(
    (total, dept) =>
      total + dept.batches.reduce((batchTotal, batch) => batchTotal + batch.student_count, 0),
    0
  );

  return (
    <>
      <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest m-0">
          Admin Dashboard
        </p>
        <h1 className="text-2xl font-black text-gray-950 mt-2 mb-1">
          Examination Control Summary
        </h1>
        <p className="text-sm text-gray-500 m-0">
          Manage core academic records, faculty profiles, students and exam rooms.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          label="TOTAL ENROLLED STUDENTS"
          value={totalStudents}
          accent="#3B82F6"
          action="Manage Profiles"
          onClick={() => router.push("/dashboards/admindashboard/students")}
        />
        <MetricCard
          label="ACTIVE DEPARTMENTS"
          value={departments.length}
          accent="#10B981"
          action="Open Structure"
          onClick={() => router.push("/dashboards/admindashboard/academic-structure")}
        />
        <MetricCard
          label="REGISTERED BATCHES"
          value={totalBatches}
          accent="#F59E0B"
          action="Manage Batches"
          onClick={() => router.push("/dashboards/admindashboard/academic-structure")}
        />
        <MetricCard
          label="EXAMINATION ROOMS"
          value="View"
          accent="#8B5CF6"
          action="Seat Layouts"
          onClick={() => router.push("/dashboards/admindashboard/classrooms")}
        />
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h2 className="text-base font-extrabold text-gray-950 m-0">
              Academic Structure
            </h2>
            <p className="text-sm text-gray-500 mt-1 mb-0 max-w-2xl">
              Departments and batches now live in a dedicated management page with add,
              edit, remove, search and dropdown controls.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboards/admindashboard/academic-structure")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-5 py-3 rounded-lg border-none cursor-pointer"
          >
            Open Academic Structure
          </button>
        </div>
      </section>
    </>
  );
}

function MetricCard({
  label,
  value,
  accent,
  action,
  onClick,
}: {
  label: string;
  value: number | string;
  accent: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <article
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <p className="text-[11px] font-extrabold text-gray-400 tracking-wider m-0">{label}</p>
      <p className="text-4xl font-black text-gray-950 mt-3 mb-4">{value}</p>
      <button
        onClick={onClick}
        className="bg-transparent border-none p-0 text-left text-xs font-extrabold cursor-pointer w-fit"
        style={{ color: accent }}
      >
        {action} -&gt;
      </button>
    </article>
  );
}
