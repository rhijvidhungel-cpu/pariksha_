"use client";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser,faBars } from "@fortawesome/free-solid-svg-icons";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("Student Name");

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "student") {
      router.push("/");
      return;
    }

    setStudentName(name);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <label htmlFor="Username" className="block text-gray-700 text-sm font-bold mb-2">
                                    <FontAwesomeIcon icon={faUser} className="mr-2 inline w-3.5" />
                                    Kunal Panjiyar
                                </label>

        <button
          onClick={() => router.push("/notifications")}
          className="bg-white shadow px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          🔔
        </button>
        <button
          onClick={() => router.push("/notifications")}
          className="bg-white shadow px-5 py-2 rounded-lg hover:bg-gray-50"
        >
        
        </button>
         <label htmlFor="bars" className="block text-gray-700 text-sm font-bold mb-2">
                                   <FontAwesomeIcon icon={faBars} />
                                    .
                                </label>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">

        <h2 className="text-xl font-semibold mb-6">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <button
                            type="submit"
                            className="bg-linear-to-r from-blue-500 to-purple-500 hover:from blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:outline-shadow w-full"
                        >
                            View Seat Allocation
                        </button>

          <button
                            type="submit"
                            className="bg-linear-to-r from-blue-500 to-purple-500 hover:from blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:outline-shadow w-full"
                        >
                            View Exam Schedule
                        </button>

          

         <button
                            type="submit"
                            className="bg-linear-to-r from-blue-500 to-purple-500 hover:from blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:outline-shadow w-full"
                        >
                            View Profile
                        
                        </button>
        </div>

        {/* Logout */}
        <div className="mt-8 text-right">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-6 py-2 rounded-lg shadow hover:bg-red-600"
          >
            Log out
          </button>
        </div>

      </div>
    </div>
  );
}