"use client";

import Link from "next/link";
import { useState } from "react";

const API = "https://pariksha-9qjs.onrender.com";

export default function ForgotPasswordPage() {
  const [option, setOption] = useState<"landing" | "admin-reset" | "student-contact">("landing");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePinReset(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/admin/reset-with-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), pin }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Unable to reset admin password.");
      }

      setMessage(data.message || "Password reset successful. Use 'temporary_password' to log in.");
      setPin("");
    } catch (err: any) {
      setError(err.message || "Unable to reset admin password.");
    } finally {
      setLoading(false);
    }
  }

  // Admin PIN Reset View
  if (option === "admin-reset") {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-950">
        <section className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-7">
          <h1 className="text-2xl font-extrabold text-gray-900">Reset Admin Password</h1>
          <p className="text-sm text-gray-600 mt-2">
            Enter your admin email and the secret PIN you created. The password will
            reset to <span className="font-mono font-bold">temporary_password</span>.
          </p>

          <form onSubmit={handlePinReset} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500"
                placeholder="admin@ku.edu.np"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Secret PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500"
                placeholder="Enter your secret PIN"
                required
                maxLength={20}
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
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-lg py-3"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => { setOption("landing"); setError(""); setMessage(""); setUsername(""); setPin(""); }}
              className="text-sm text-slate-500 hover:text-slate-700 text-center"
            >
              ← Back
            </button>
          </form>
        </section>
      </main>
    );
  }

  // Student Contact View
  if (option === "student-contact") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg">
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
            <button
              onClick={() => setOption("landing")}
              className="block w-full text-center border py-4 rounded-xl text-purple-600 font-semibold hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Landing - Two Options
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reset Your Password
          </h1>
          <p className="text-gray-600 mt-2">
            Select the account type to proceed with password reset.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setOption("admin-reset")}
            className="block w-full text-center bg-linear-to-r from-purple-600 to-blue-500 text-white py-5 rounded-xl font-semibold hover:opacity-90 text-lg"
          >
            Reset Password for Admin
          </button>

          <button
            onClick={() => setOption("student-contact")}
            className="block w-full text-center border-2 border-purple-600 text-purple-700 py-5 rounded-xl font-semibold hover:bg-purple-50 text-lg"
          >
            Reset Password for Students / Teachers
          </button>

          <Link
            href="/"
            className="block text-center border py-4 rounded-xl text-purple-600 font-semibold hover:bg-gray-50 mt-4"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}