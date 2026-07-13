"use client";

import Link from "next/link";
import { useState } from "react";

const API = "https://pariksha-9qjs.onrender.com";

type ViewState = "student-contact" | "admin-login" | "admin-pin" | "admin-reset";

export default function ForgotPasswordPage() {
  const [view, setView] = useState<ViewState>("student-contact");

  // Admin login (email only) state
  const [adminUsername, setAdminUsername] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminLoginMessage, setAdminLoginMessage] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  // Admin PIN verification state
  const [adminPin, setAdminPin] = useState("");
  const [adminPinError, setAdminPinError] = useState("");
  const [adminPinMessage, setAdminPinMessage] = useState("");
  const [adminPinLoading, setAdminPinLoading] = useState(false);

  // Admin password reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [verifiedUsername, setVerifiedUsername] = useState("");

  async function handleAdminLogin(event: React.FormEvent) {
    event.preventDefault();
    setAdminLoginError("");
    setAdminLoginMessage("");
    setAdminLoginLoading(true);

    try {
      // First check if this admin account exists and if they have a PIN
      const checkRes = await fetch(`${API}/admin/check-pin-exists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername.trim() }),
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        throw new Error(checkData.detail || "Admin account not found.");
      }

      if (checkData.has_pin) {
        // Admin has a PIN → go to PIN verification
        setVerifiedUsername(adminUsername.trim());
        setView("admin-pin");
      } else {
        // No PIN set → use legacy reset (directly to temporary_password)
        const resetRes = await fetch(`${API}/admin/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: adminUsername.trim() }),
        });
        const resetData = await resetRes.json();

        if (!resetRes.ok) {
          throw new Error(resetData.detail || "Password reset failed.");
        }

        setAdminLoginMessage(
          "Password has been reset to 'temporary_password'. Please login and set a new password and PIN."
        );
      }
    } catch (err: any) {
      setAdminLoginError(err.message || "Operation failed.");
    } finally {
      setAdminLoginLoading(false);
    }
  }

  async function handleVerifyPin(event: React.FormEvent) {
    event.preventDefault();
    setAdminPinError("");
    setAdminPinMessage("");
    setAdminPinLoading(true);

    try {
      const res = await fetch(`${API}/admin/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: verifiedUsername.trim(),
          pin: adminPin,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "PIN verification failed.");
      }

      setAdminPinMessage("PIN verified! Set your new password below.");

      // Move to reset step after short delay
      setTimeout(() => {
        setView("admin-reset");
      }, 800);
    } catch (err: any) {
      setAdminPinError(err.message || "PIN verification failed.");
    } finally {
      setAdminPinLoading(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setResetError("");
    setResetMessage("");
    setResetLoading(true);

    try {
      if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const res = await fetch(`${API}/admin/reset-password-with-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: verifiedUsername,
          pin: adminPin,
          new_password: newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Password reset failed.");
      }

      setResetMessage(data.message || "Password reset successful!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setResetError(err.message || "Password reset failed.");
    } finally {
      setResetLoading(false);
    }
  }

  function goBackToContact() {
    setView("student-contact");
    setAdminUsername("");
    setAdminPin("");
    setAdminLoginError("");
    setAdminLoginMessage("");
    setAdminPinError("");
    setAdminPinMessage("");
    setVerifiedUsername("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetMessage("");
  }

  function goToAdminLogin() {
    setView("admin-login");
    setAdminUsername("");
    setAdminPin("");
    setAdminLoginError("");
    setAdminLoginMessage("");
    setAdminPinError("");
    setAdminPinMessage("");
    setVerifiedUsername("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetMessage("");
  }

  function goBackToAdminLogin() {
    setView("admin-login");
    setAdminPin("");
    setAdminPinError("");
    setAdminPinMessage("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetMessage("");
  }

  // ==================== ADMIN RESET VIEW ====================
  if (view === "admin-reset") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Set New Password</h1>
          <p className="text-sm text-gray-600 mt-2">
            PIN verified for <strong className="font-mono">{verifiedUsername}</strong>.
            Choose a new password.
          </p>

          <form onSubmit={handleResetPassword} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500"
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500"
                placeholder="Re-enter new password"
                required
                minLength={6}
              />
            </div>

            {resetError && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm font-semibold">
                {resetError}
              </div>
            )}
            {resetMessage && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg p-3 text-sm font-semibold">
                {resetMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-lg py-3"
            >
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={goBackToAdminLogin}
              className="text-sm text-slate-500 hover:text-slate-700 text-center"
            >
              ← Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== ADMIN PIN VERIFICATION VIEW ====================
  if (view === "admin-pin") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Enter Secret PIN</h1>
          <p className="text-sm text-gray-600 mt-2">
            Account <strong className="font-mono">{verifiedUsername}</strong> has a
            PIN set. Enter it to verify your identity.
          </p>

          <form onSubmit={handleVerifyPin} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Secret PIN
              </label>
              <input
                type="password"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500"
                placeholder="Enter your secret PIN"
                required
                maxLength={20}
              />
            </div>

            {adminPinError && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm font-semibold">
                {adminPinError}
              </div>
            )}
            {adminPinMessage && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg p-3 text-sm font-semibold">
                {adminPinMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={adminPinLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-lg py-3"
            >
              {adminPinLoading ? "Verifying..." : "Verify PIN"}
            </button>

            <button
              type="button"
              onClick={goBackToAdminLogin}
              className="text-sm text-slate-500 hover:text-slate-700 text-center"
            >
              ← Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== ADMIN LOGIN (ENTER USERNAME) VIEW ====================
  if (view === "admin-login") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Password Reset</h1>
          <p className="text-sm text-gray-600 mt-2">
            Enter your admin email/username. If you have a PIN set, you will be
            asked to verify it. Otherwise, the password will be reset to{" "}
            <span className="font-mono font-bold">temporary_password</span>.
          </p>

          <form onSubmit={handleAdminLogin} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Admin Email / Username
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500"
                placeholder="admin@ku.edu.np"
                required
              />
            </div>

            {adminLoginError && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm font-semibold">
                {adminLoginError}
              </div>
            )}
            {adminLoginMessage && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg p-3 text-sm font-semibold">
                {adminLoginMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={adminLoginLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-lg py-3"
            >
              {adminLoginLoading ? "Checking..." : "Submit"}
            </button>

            <button
              type="button"
              onClick={goBackToContact}
              className="text-sm text-slate-500 hover:text-slate-700 text-center"
            >
              ← Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== DEFAULT: STUDENT / TEACHER CONTACT VIEW ====================
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg">
        {/* "Forgot for Admin?" link at top */}
        <div className="text-right mb-4">
          <button
            onClick={goToAdminLogin}
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