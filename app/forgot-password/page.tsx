"use client";

import Link from "next/link";
import { useState } from "react";

const API = "https://pariksha-9qjs.onrender.com";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Unable to reset password.");
      }

      setMessage(
        `Password reset successful. Log in with your temporary password, then create a new password.${
          data.temporary_password
            ? ` Temporary password: ${data.temporary_password}`
            : ""
        }`
      );
      setUsername("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-950">
      <section className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-7">
        <h1 className="text-2xl font-extrabold">Forgot Password</h1>
        <p className="text-sm text-slate-500 mt-2">
          Enter your username (student roll-batch or teacher email). Your password
          will reset to the original temporary password.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500"
              placeholder="e.g. 12345-CE-2024 or teacher@ku.edu.np"
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
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-lg py-3"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-center text-sm">
          <Link href="/forgot-admin-password" className="text-indigo-600 font-semibold">
            Forgot password for admin?
          </Link>
          <Link href="/" className="text-slate-500">
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
