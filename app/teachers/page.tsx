"use client";

import Link from "next/link";

export default function TeachersPage() {
  const teachers = [
    {
      teacher_id: 1,
      full_name: "Ram Sharma",
      department: "CS",
    },
    {
      teacher_id: 2,
      full_name: "Shyam Thapa",
      department: "CE",
    },
    {
      teacher_id: 3,
      full_name: "Sita KC",
      department: "MG",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Teacher Management</h1>
        <p className="text-gray-500">Pariksha Admin Panel</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Teachers List</h2>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.teacher_id} className="border-b hover:bg-gray-50">
                <td className="p-3">{teacher.full_name}</td>
                <td className="p-3">{teacher.department}</td>
                <td className="p-3 text-center">
                  <Link
                    href={`/admin/teachers/edit/${teacher.teacher_id}`}
                    className="mr-2 rounded bg-blue-500 px-3 py-1 text-white"
                  >
                    Edit
                  </Link>
                  <button className="rounded bg-red-500 px-3 py-1 text-white">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href="/admin/teachers/add"
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-3xl text-white shadow-lg hover:bg-blue-700"
      >
        +
      </Link>
    </div>
  );
}
