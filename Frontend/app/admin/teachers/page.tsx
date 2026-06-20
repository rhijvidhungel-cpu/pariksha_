"use client";

import Link from "next/link";

export default function TeachersPage() {

  const teachers = [
    {
      teacher_id: 1,
      full_name: "Ram Sharma",
      department: "CS"
    },
    {
      teacher_id: 2,
      full_name: "Shyam Thapa",
      department: "CE"
    },
    {
      teacher_id: 3,
      full_name: "Sita KC",
      department: "MG"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Teacher Management
        </h1>

        <p className="text-gray-500">
          Pariksha Admin Panel
        </p>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">

        <h2 className="text-xl font-semibold mb-4">
          Teachers List
        </h2>

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
              <tr
                key={teacher.teacher_id}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-3">
                  {teacher.full_name}
                </td>

                <td className="p-3">
                  {teacher.department}
                </td>

                <td className="p-3 text-center">

                  <Link
                    href={`/admin/teachers/edit/${teacher.teacher_id}`}
                    className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                  >
                    Edit
                  </Link>

                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>

                </td>
              </tr>
            ))}

          </tbody>

        </table>
      </div>

      {/* Floating Add Button */}
      <Link
        href="/admin/teachers/add"
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white text-3xl rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700"
      >
        +
      </Link>

    </div>
  );
}