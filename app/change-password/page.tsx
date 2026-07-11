"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = "https://pariksha-9qjs.onrender.com";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userId = localStorage.getItem("user_id");
      const role = localStorage.getItem("role");
      const res = await fetch(`${API}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Password change failed.");

      if (role === "admin") router.push("/dashboards/admindashboard");
      else if (role === "teacher") router.push("/dashboards/teacherdashboard");
      else router.push("/dashboards/studentdashboard");
    } catch (err: any) {
      setError(err.message || "Password change failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-8"
      >
        <div className="text-center mb-6">
          <h1 className="text-[22px] font-extrabold tracking-wide m-0 bg-gradient-to-r from-[#6366F1] to-[#80f755] bg-clip-text text-transparent">
            PARIKSHA
          </h1>
          <p className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wider mt-1">Change Password</p>
        </div>

        <h2 className="text-xl font-extrabold text-[#111827]">Create New Password</h2>
        <p className="text-sm text-[#6B7280] mt-2">
          Enter your current password and choose a new password.
        </p>

        <label className="block text-xs font-bold text-[#6B7280] mt-6 mb-2">
          Current Password
        </label>
        <input
          type="password"
          value={oldPassword}
          onChange={(event) => setOldPassword(event.target.value)}
          className="w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
          required
        />

        <label className="block text-xs font-bold text-[#6B7280] mt-4 mb-2">
          New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
          required
        />

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm font-semibold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-[#9CA3AF] text-white rounded-lg py-3 text-sm font-bold transition-colors"
        >
          {loading ? "Saving..." : "Save Password"}
        </button>
      </form>
    </div>
  );
}