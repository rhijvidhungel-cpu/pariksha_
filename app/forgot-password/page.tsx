"use client";

import Link from "next/link";
import { useState } from "react";

const API = "https://pariksha-9qjs.onrender.com";

export default function ForgotPasswordPage() {
  const [view, setView] = useState<"student" | "admin">("student");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdminReset(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Unable to reset admin password.");
      }

      setMessage("Password reset successfully. You can now log in.");
    } catch (err: any) {
      setError(err.message || "Unable to reset admin password.");
    } finally {
      setLoading(false);
    }
  }

  if (view === "admin") {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-950">
        <section className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-7">
          <h1 className="text-2xl font-extrabold text-gray-900">Reset Admin Password</h1>
          <p className="text-sm text-gray-600 mt-2">
            Enter your admin email/username to reset your password.
          </p>

          <form onSubmit={handleAdminReset} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Admin Email / Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500"
                placeholder="admin@ku.edu.np"
                required
              />
            </div>

            {message && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg p-3 text-sm font-semibold">
                {message}
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-lg py-3"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => {
                setView("student");
                setUsername("");
                setError("");
                setMessage("");
              }}
              className="text-sm text-slate-500 hover:text-slate-700 text-center"
            >
              ← Back
            </button>

            <Link
              href="/"
              className="text-sm text-indigo-600 hover:text-indigo-800 text-center font-semibold"
            >
              Back to Login
            </Link>
          </form>
        </section>
      </main>
    );
  }

  // DEFAULT: Student/Teacher Contact View
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg">
        <div className="text-right mb-4">
          <button
            onClick={() => setView("admin")}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer bg-transparent border-none"
          >
            Forgot for Admin?
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎧</div>
          <h1 className="text-2xl font-bold text-gray-900">
            Contact Administration
          </h1>
          <p className="text-gray-700 mt-2">
            Password resets for students and teachers are handled by the
            university administration. Please contact ISMS to have your
            password reset.
          </p>
        </div>

        <div className="border rounded-2xl overflow-hidden mb-8">
          <div className="p-5 border-b">
            <p className="font-semibold text-gray-900">Kathmandu University</p>
            <p className="text-gray-700">Block 03, Central Campus</p>
            <p className="text-gray-700">Dhulikhel, Nepal</p>
          </div>
          <div className="p-5 border-b flex justify-between">
            <span className="text-gray-700 font-medium">Phone</span>
            <span className="text-gray-900">+977-11-415100</span>
          </div>
          <div className="p-5 border-b flex justify-between">
            <span className="text-gray-700 font-medium">Extension</span>
            <span className="text-gray-900">4100</span>
          </div>
          <div className="p-5 flex justify-between">
            <span className="text-gray-700 font-medium">Email</span>
            <span className="font-medium text-gray-900">isms@ku.edu.np</span>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full text-center border py-4 rounded-xl text-purple-600 font-semibold hover:bg-gray-50"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}