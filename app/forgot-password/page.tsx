"use client";

import Link from "next/link";
import { useState } from "react";

const API = "https://pariksha-9qjs.onrender.com";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"contact" | "reset">("contact");
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

  if (step === "reset") {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-950">
        <section className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-7">
          <h1 className="text-2xl font-extrabold">Forgot Password</h1>
          <p className="text-sm text-slate-500 mt-2">
            Enter your username (student roll-batch or teacher email). Your password
            will reset to the original temporary password sent by the system.
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

            <button
              type="button"
              onClick={() => { setStep("contact"); setError(""); setMessage(""); }}
              className="text-sm text-slate-500 hover:text-slate-700 text-center"
            >
              ← Back to contact information
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎧</div>

          <h1 className="text-2xl font-bold text-gray-800">
            Need help accessing your account?
          </h1>

          <p className="text-gray-500 mt-2">
            Password resets for students and teachers are handled by the university
            administration. Please contact ISMS for assistance, or use the automated
            reset option below.
          </p>
        </div>

        {/* Contact Card */}
        <div className="border rounded-2xl overflow-hidden mb-8">
          <div className="p-5 border-b">
            <p className="font-semibold text-gray-700">
              Kathmandu University
            </p>
            <p className="text-gray-500">
              Block 03, Central Campus
            </p>
            <p className="text-gray-500">
              Dhulikhel, Nepal
            </p>
          </div>

          <div className="p-5 border-b flex justify-between">
            <span>Phone</span>
            <span>+977-11-415100</span>
          </div>

          <div className="p-5 border-b flex justify-between">
            <span>Extension</span>
            <span>4100</span>
          </div>

          <div className="p-5 flex justify-between">
            <span>Email</span>
            <span className="font-medium">isms@ku.edu.np</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => setStep("reset")}
            className="block w-full text-center bg-linear-to-r from-purple-600 to-blue-500 text-white py-4 rounded-xl font-semibold hover:opacity-90"
          >
            Automated Password Reset
          </button>

          <a
            href="mailto:isms@ku.edu.np"
            className="block text-center border py-4 rounded-xl text-purple-600 font-semibold hover:bg-gray-50"
          >
            Contact Administration
          </a>

          <Link
            href="/forgot-admin-password"
            className="block text-center border py-4 rounded-xl text-purple-600 font-semibold hover:bg-gray-50"
          >
            Admin Password Reset
          </Link>

          <Link
            href="/"
            className="block text-center border py-4 rounded-xl text-purple-600 font-semibold hover:bg-gray-50"
          >
            ← Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}