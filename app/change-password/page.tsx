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
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-950">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-7"
      >
        <h1 className="text-2xl font-extrabold">Create New Password</h1>
        <p className="text-sm text-slate-500 mt-2">
          Enter your temporary password and choose a new password.
        </p>

        <label className="block text-xs font-bold text-slate-600 mt-6 mb-2">
          Temporary Password
        </label>
        <input
          type="password"
          value={oldPassword}
          onChange={(event) => setOldPassword(event.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-3"
          required
        />

        <label className="block text-xs font-bold text-slate-600 mt-4 mb-2">
          New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-3"
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
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg py-3 font-bold"
        >
          {loading ? "Saving..." : "Save Password"}
        </button>
      </form>
    </main>
  );
}
