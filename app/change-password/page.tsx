"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "https://pariksha-9qjs.onrender.com";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number>(0);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // PIN management state (admin only)
  const [hasPin, setHasPin] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinMessage, setPinMessage] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    const storedRole = localStorage.getItem("role");
    setUserId(Number(storedUserId));
    setRole(storedRole);

    // Check if admin already has a PIN
    if (storedRole === "admin" && storedUserId) {
      fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: localStorage.getItem("username"),
          password: "dummy-check",
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.has_pin !== undefined) setHasPin(data.has_pin);
        })
        .catch(() => {});
    }
  }, []);

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Password change failed.");

      setMessage("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");

      setTimeout(() => {
        if (role === "admin") router.push("/dashboards/admindashboard");
        else if (role === "teacher") router.push("/dashboards/teacherdashboard");
        else router.push("/dashboards/studentdashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Password change failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPin(event: React.FormEvent) {
    event.preventDefault();
    setPinError("");
    setPinMessage("");
    setPinLoading(true);

    try {
      if (newPin !== confirmPin) {
        throw new Error("PINs do not match.");
      }
      if (newPin.length < 4) {
        throw new Error("PIN must be at least 4 characters.");
      }

      const endpoint = hasPin ? `${API}/admin/change-pin` : `${API}/admin/set-pin`;
      const body = hasPin
        ? { user_id: userId, old_pin: currentPin, new_pin: newPin }
        : { user_id: userId, pin: newPin };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "PIN operation failed.");

      setPinMessage(data.message || "PIN set successfully!");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setHasPin(true);
    } catch (err: any) {
      setPinError(err.message || "PIN operation failed.");
    } finally {
      setPinLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Password Change Form */}
        <form
          onSubmit={submitPassword}
          className="w-full bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-8"
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

          <label className="block text-xs font-bold text-[#374151] mt-6 mb-2">
            Current Password
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
            className="w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm text-[#111827] font-medium outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
            required
          />

          <label className="block text-xs font-bold text-[#374151] mt-4 mb-2">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm text-[#111827] font-medium outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
            required
          />

          {error && (
            <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm font-semibold">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg p-3 text-sm font-semibold">
              {message}
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

        {/* Admin PIN Management Section */}
        {role === "admin" && (
          <form
            onSubmit={handleSetPin}
            className="w-full bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-8"
          >
            <h2 className="text-xl font-extrabold text-[#111827]">
              {hasPin ? "Change Secret PIN" : "Set Secret PIN"}
            </h2>
            <p className="text-sm text-[#6B7280] mt-2">
              {hasPin
                ? "Update your secret PIN used for password recovery."
                : "Create a secret PIN to reset your password if you forget it."}
            </p>

            {hasPin && (
              <>
                <label className="block text-xs font-bold text-[#374151] mt-6 mb-2">
                  Current PIN
                </label>
                <input
                  type="password"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  className="w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm text-[#111827] font-medium outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
                  required
                  maxLength={20}
                />
              </>
            )}

            <label className="block text-xs font-bold text-[#374151] mt-4 mb-2">
              {hasPin ? "New PIN" : "Secret PIN"}
            </label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm text-[#111827] font-medium outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
              required
              maxLength={20}
              placeholder="At least 4 characters"
            />

            <label className="block text-xs font-bold text-[#374151] mt-4 mb-2">
              Confirm PIN
            </label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm text-[#111827] font-medium outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
              required
              maxLength={20}
              placeholder="Re-enter your PIN"
            />

            {pinError && (
              <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm font-semibold">
                {pinError}
              </div>
            )}
            {pinMessage && (
              <div className="mt-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg p-3 text-sm font-semibold">
                {pinMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={pinLoading}
              className="mt-6 w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-[#9CA3AF] text-white rounded-lg py-3 text-sm font-bold transition-colors"
            >
              {pinLoading
                ? "Saving..."
                : hasPin
                ? "Change PIN"
                : "Set PIN"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}