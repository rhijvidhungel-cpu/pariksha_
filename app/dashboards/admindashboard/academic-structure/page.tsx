"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Batch {
  batch_id: number;
  batch_name: string;
  department_id: number;
  student_count: number;
}

interface Department {
  department_id: number;
  department_name: string;
  batches: Batch[];
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://pariksha-9qjs.onrender.com";

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export default function AcademicStructurePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [batchName, setBatchName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [editingDepartmentName, setEditingDepartmentName] = useState("");
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
  const [editingBatchName, setEditingBatchName] = useState("");

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/departments`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to load departments.");
      }

      const nextDepartments = Array.isArray(data) ? data : [];
      setDepartments(nextDepartments);
      setSelectedDepartmentId((prev) => {
        if (prev && nextDepartments.some((dept) => String(dept.department_id) === prev)) {
          return prev;
        }
        return nextDepartments[0] ? String(nextDepartments[0].department_id) : "";
      });
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: getErrorMessage(err, "Could not load academic structure."),
      });
    } finally {
      setLoading(false);
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
      void fetchDepartments();
    });
  }, [fetchDepartments, router]);

  const selectedDepartment = departments.find(
    (dept) => String(dept.department_id) === selectedDepartmentId
  );

  const totalBatches = departments.reduce((total, dept) => total + dept.batches.length, 0);
  const totalStudents = departments.reduce(
    (total, dept) =>
      total + dept.batches.reduce((batchTotal, batch) => batchTotal + batch.student_count, 0),
    0
  );

  const visibleDepartments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const scopedDepartments = selectedDepartment ? [selectedDepartment] : departments;

    if (!query) return scopedDepartments;

    return scopedDepartments
      .map((dept) => {
        const departmentMatches = dept.department_name.toLowerCase().includes(query);
        const batches = dept.batches.filter((batch) =>
          batch.batch_name.toLowerCase().includes(query)
        );

        if (departmentMatches) return dept;
        if (batches.length > 0) return { ...dept, batches };
        return null;
      })
      .filter((dept): dept is Department => Boolean(dept));
  }, [departments, searchQuery, selectedDepartment]);

  const submitRequest = async (
    url: string,
    options: RequestInit,
    successMessage: string
  ) => {
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data.detail === "string" ? data.detail : "Request failed."
        );
      }

      setStatusMsg({ type: "success", text: successMessage });
      await fetchDepartments();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: getErrorMessage(err, "Request failed."),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRequest(
      `${API_BASE_URL}/api/departments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department_name: departmentName.trim() }),
      },
      "Department added successfully."
    );
    setDepartmentName("");
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDepartmentId) {
      setStatusMsg({ type: "error", text: "Select a department before adding a batch." });
      return;
    }

    await submitRequest(
      `${API_BASE_URL}/api/departments/${selectedDepartmentId}/batches`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_name: batchName.trim() }),
      },
      "Batch added successfully."
    );
    setBatchName("");
  };

  const startDepartmentEdit = (department: Department) => {
    setEditingDepartmentId(department.department_id);
    setEditingDepartmentName(department.department_name);
    setEditingBatchId(null);
  };

  const saveDepartmentEdit = async () => {
    if (!editingDepartmentId) return;

    await submitRequest(
      `${API_BASE_URL}/api/departments/${editingDepartmentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department_name: editingDepartmentName.trim() }),
      },
      "Department renamed successfully."
    );
    setEditingDepartmentId(null);
    setEditingDepartmentName("");
  };

  const removeDepartment = async (department: Department) => {
    if (
      !confirm(
        `Remove department "${department.department_name}"? Departments with batches cannot be deleted.`
      )
    ) {
      return;
    }

    await submitRequest(
      `${API_BASE_URL}/api/departments/${department.department_id}`,
      { method: "DELETE" },
      "Department deleted successfully."
    );
  };

  const startBatchEdit = (batch: Batch) => {
    setEditingBatchId(batch.batch_id);
    setEditingBatchName(batch.batch_name);
    setEditingDepartmentId(null);
  };

  const saveBatchEdit = async () => {
    if (!editingBatchId) return;

    await submitRequest(
      `${API_BASE_URL}/api/departments/batches/${editingBatchId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_name: editingBatchName.trim() }),
      },
      "Batch renamed successfully."
    );
    setEditingBatchId(null);
    setEditingBatchName("");
  };

  const removeBatch = async (batch: Batch) => {
    if (
      !confirm(
        `Remove batch "${batch.batch_name}"? Batches with students cannot be deleted.`
      )
    ) {
      return;
    }

    await submitRequest(
      `${API_BASE_URL}/api/departments/batches/${batch.batch_id}`,
      { method: "DELETE" },
      "Batch deleted successfully."
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest m-0">
              Admin Registry
            </p>
            <h1 className="text-2xl font-black text-gray-950 mt-2 mb-1">
              Academic Structure
            </h1>
            <p className="text-sm text-gray-500 m-0">
              Create departments first, then manage batches inside each department.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboards/admindashboard")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-extrabold px-4 py-3 rounded-lg border-none cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryTile label="Departments" value={departments.length} />
        <SummaryTile label="Batches" value={totalBatches} />
        <SummaryTile label="Linked Students" value={totalStudents} />
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <form onSubmit={handleCreateDepartment} className="flex flex-col gap-3">
            <h2 className="text-sm font-black text-gray-950 uppercase m-0">
              Add Department
            </h2>
            <input
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="Department name"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="w-fit bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-xs font-extrabold px-5 py-3 rounded-lg border-none cursor-pointer"
            >
              Add Department
            </button>
          </form>

          <form onSubmit={handleCreateBatch} className="flex flex-col gap-3">
            <h2 className="text-sm font-black text-gray-950 uppercase m-0">Add Batch</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500"
                required
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.department_id} value={dept.department_id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Batch name, e.g. CS-2026"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving || !selectedDepartmentId}
              className="w-fit bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-extrabold px-5 py-3 rounded-lg border-none cursor-pointer"
            >
              Add Batch
            </button>
          </form>
        </div>
      </section>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-bold border ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/70 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search department or batch..."
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 bg-white"
          />
          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 bg-white"
          >
            <option value="">Show all departments</option>
            {departments.map((dept) => (
              <option key={dept.department_id} value={dept.department_id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <p className="p-8 text-center text-sm text-gray-400 m-0">
              Loading academic records...
            </p>
          ) : visibleDepartments.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400 m-0">
              No departments or batches match this view.
            </p>
          ) : (
            visibleDepartments.map((department) => (
              <div key={department.department_id} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="min-w-0">
                    {editingDepartmentId === department.department_id ? (
                      <input
                        type="text"
                        value={editingDepartmentName}
                        onChange={(e) => setEditingDepartmentName(e.target.value)}
                        className="border border-indigo-300 rounded-lg px-3 py-2 text-sm font-bold text-gray-950 outline-none"
                      />
                    ) : (
                      <h2 className="text-base font-black text-gray-950 m-0">
                        {department.department_name}
                      </h2>
                    )}
                    <p className="text-xs text-gray-500 mt-1 mb-0">
                      {department.batches.length} batches registered
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingDepartmentId === department.department_id ? (
                      <>
                        <button
                          onClick={saveDepartmentEdit}
                          disabled={saving}
                          className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-extrabold border-none cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingDepartmentId(null)}
                          className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-extrabold border-none cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startDepartmentEdit(department)}
                          className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-extrabold border-none cursor-pointer"
                        >
                          Edit Dept
                        </button>
                        <button
                          onClick={() => removeDepartment(department)}
                          className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-extrabold border-none cursor-pointer"
                        >
                          Remove Dept
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto border border-gray-100 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-400 font-black">
                        <th className="px-4 py-3">Batch</th>
                        <th className="px-4 py-3">Students</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {department.batches.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-5 text-sm text-gray-400">
                            No batches in this department yet.
                          </td>
                        </tr>
                      ) : (
                        department.batches.map((batch) => (
                          <tr key={batch.batch_id}>
                            <td className="px-4 py-3">
                              {editingBatchId === batch.batch_id ? (
                                <input
                                  type="text"
                                  value={editingBatchName}
                                  onChange={(e) => setEditingBatchName(e.target.value)}
                                  className="border border-indigo-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-950 outline-none"
                                />
                              ) : (
                                <span className="font-mono text-sm font-bold text-gray-900">
                                  {batch.batch_name}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {batch.student_count}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                {editingBatchId === batch.batch_id ? (
                                  <>
                                    <button
                                      onClick={saveBatchEdit}
                                      disabled={saving}
                                      className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-extrabold border-none cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingBatchId(null)}
                                      className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-extrabold border-none cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startBatchEdit(batch)}
                                      className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-extrabold border-none cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => removeBatch(batch)}
                                      className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-extrabold border-none cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <article className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider m-0">
        {label}
      </p>
      <p className="text-3xl font-black text-gray-950 mt-2 mb-0">{value}</p>
    </article>
  );
}
