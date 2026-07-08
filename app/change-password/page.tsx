"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://pariksha-9qjs.onrender.com";

export default function ChangePasswordPage() {
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const userId = localStorage.getItem("user_id");
        const role = localStorage.getItem("role");

        if (!userId) {
            alert("Session expired.");
            router.push("/");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API}/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: Number(userId),
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.detail);
                return;
            }

            alert("Password changed successfully.");

            if (role === "student")
                router.push("/dashboards/studentdashboard");

            else if (role === "teacher")
                router.push("/dashboards/teacherdashboard");

            else
                router.push("/dashboards/admindashboard");

        } catch (err) {
            alert("Server error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">

            <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8">

                <h1 className="text-2xl font-bold text-center mb-2">
                    Change Password
                </h1>

                <p className="text-gray-500 text-center mb-8">
                    This is your first login. Please create a new password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className="font-medium">
                            Current Password
                        </label>

                        <input
                            type="password"
                            className="border rounded-lg w-full mt-2 p-3"
                            value={currentPassword}
                            onChange={(e)=>setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="font-medium">
                            New Password
                        </label>

                        <input
                            type="password"
                            className="border rounded-lg w-full mt-2 p-3"
                            value={newPassword}
                            onChange={(e)=>setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="font-medium">
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            className="border rounded-lg w-full mt-2 p-3"
                            value={confirmPassword}
                            onChange={(e)=>setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white rounded-lg p-3 font-semibold hover:bg-indigo-700"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>

                </form>

            </div>

        </div>
    );
}