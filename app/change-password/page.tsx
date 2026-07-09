"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";


const API = process.env.NEXT_PUBLIC_API_URL || "https://pariksha-9qjs.onrender.com";

export default function ChangePasswordPage() {
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

                <h1 className="text-2xl font-bold text-center mb-2 text-gray-900">
                    Change Password
                </h1>

                <p className="text-gray-500 text-center mb-8">
                    This is your first login. Please create a new password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className="font-medium text-gray-900">
                            Current Password
                        </label>

                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                className="border rounded-lg w-full mt-2 p-3 pr-10 text-gray-900"
                                value={currentPassword}
                                onChange={(e)=>setCurrentPassword(e.target.value)}
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-[58%] -translate-y-1/2 text-gray-500"
                            >
                                {showCurrentPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="font-medium text-gray-900">
                            New Password
                        </label>

                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                className="border rounded-lg w-full mt-2 p-3 pr-10 text-gray-900"
                                value={newPassword}
                                onChange={(e)=>setNewPassword(e.target.value)}
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-[58%] -translate-y-1/2 text-gray-500"
                            >
                                {showNewPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="font-medium text-gray-900">
                            Confirm Password
                        </label>

                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="border rounded-lg w-full mt-2 p-3 pr-10 text-gray-900"
                                value={confirmPassword}
                                onChange={(e)=>setConfirmPassword(e.target.value)}
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-[58%] -translate-y-1/2 text-gray-500"
                            >
                                {showConfirmPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                        </div>
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
