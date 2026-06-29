"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";

const LoginForm = () => {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiBaseUrl}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (typeof window !== "undefined") {
                    localStorage.setItem("username", data.user.name);
                    localStorage.setItem("role", data.role);
                }

                if (data.role === "student") router.push("/dashboards/studentdashboard");
                else if (data.role === "teacher") router.push("/dashboards/teacherdashboard");
                else if (data.role === "admin") router.push("/dashboards/admindashboard");
                else router.push("/");
                return;
            }

            if (!res.ok || (data.message && data.message.toLowerCase().includes("backend error"))) {
                throw new Error(data.message || "Backend login failed");
            }

            alert(data.message || "Invalid credentials");
            return;
        } catch (err) {
            console.warn("Backend unreachable, falling back to local credentials", err);
        }

        // Fallback: local hardcoded credentials (development only)
        if (username === "student" && password === "student123") {
            localStorage.setItem("username", "student");
            localStorage.setItem("role", "student");
            router.push("/dashboards/studentdashboard");
            return;
        }

        if (username === "teacher" && password === "teacher123") {
            localStorage.setItem("username", "teacher");
            localStorage.setItem("role", "teacher");
            router.push("/dashboards/teacherdashboard");
            return;
        }

        if (username === "admin" && password === "admin123") {
            localStorage.setItem("username", "admin");
            localStorage.setItem("role", "admin");
            router.push("/dashboards/admindashboard");
            return;
        }

        alert("Invalid credentials. Try: student/student123, teacher/teacher123, admin/admin123");
    };

    return (
        /* Cleaned container: width fills the parent absolute wrapper perfectly */
        <div className="w-full">
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                <h2 className="text-3xl font-bold mb-6 text-white">
                    <span className="bg-linear-to-r text-transparent from-blue-500 to-purple-500 bg-clip-text">Pariksha</span>
                </h2>
                <form onSubmit={handleSubmit}>

                    <div className="mb-6">
                        <label htmlFor="Username" className="block text-gray-700 text-sm font-bold mb-2">
                            <FontAwesomeIcon icon={faUser} className="mr-2 inline w-3.5" />
                            Username
                        </label>
                        <div>
                            <input
                                id="Username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="off"
                                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Enter your username"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="Password" className="block text-gray-700 text-sm font-bold mb-2">
                            <FontAwesomeIcon icon={faLock} className="mr-2 inline w-3.5" />
                            Password
                        </label>
                        <div>
                            <input
                                id="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="off"
                                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    <div className="flex item-center justify-center">
                        <button
                            type="submit"
                            className="bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:outline-shadow w-full"
                        >
                            Login
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <Link href="/contact-admin" className="text-gray-600 hover:underline">
                            Forgot Password?
                        </Link>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default LoginForm;