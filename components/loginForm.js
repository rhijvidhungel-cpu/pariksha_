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
            const apiBaseUrl = "https://pariksha-9qjs.onrender.com";
            const res = await fetch(`${apiBaseUrl}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (typeof window !== "undefined") {
                    localStorage.setItem("user_id", data.user_id);
                    localStorage.setItem("username", data.username);
                    localStorage.setItem("role", data.role);
                }
                if (data.first_login) {
                    router.push("/change-password");
                    return;
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
        /* The main outer frame spans full dimensions overlaying your background */
        <div style={styles.pageOverlayWrapper}>
            
            {/* Left side viewport column acting as the anchor box */}
            <div style={styles.leftFormColumn}>
                <div style={styles.formCard}>
                    <h2 style={styles.brandTitle}>
                        <span style={styles.gradientText}>Pariksha</span>
                    </h2>
                    
                    <form onSubmit={handleSubmit}>
                        {/* USERNAME FIELD */}
                        <div style={styles.fieldGroup}>
                            <label htmlFor="Username" style={styles.fieldLabel}>
                                <FontAwesomeIcon icon={faUser} style={styles.fieldIcon} />
                                Username
                            </label>
                            <input
                                id="Username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="off"
                                style={styles.textInput}
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        {/* PASSWORD FIELD */}
                        <div style={styles.fieldGroup}>
                            <label htmlFor="Password" style={styles.fieldLabel}>
                                <FontAwesomeIcon icon={faLock} style={styles.fieldIcon} />
                                Password
                            </label>
                            <input
                                id="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="off"
                                style={styles.textInput}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {/* SUBMIT */}
                        <div style={styles.actionWrapper}>
                            <button type="submit" style={styles.primarySubmitBtn}>
                                Login
                            </button>
                        </div>

                        <div style={styles.supportLinkCenter}>
                            <Link href="/contact-admin" style={styles.forgotPassLink}>
                                Forgot Password?
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right empty spacer area to allow background art to stay visible */}
            <div style={styles.rightSpacerColumn} />
        </div>
    );
};

// CLEAN ALIGNED STYLING HOOKS
const styles = {
    pageOverlayWrapper: {
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        fontFamily: "Inter, system-ui, sans-serif",
    },
    leftFormColumn: {
        width: "100%",
        maxWidth: "420px", /* Beautifully thin card profile width */
        backgroundColor: "rgba(255, 255, 255, 0.96)", /* Subtle premium opaque white overlay */
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 40px",
        boxShadow: "10px 0 30px rgba(0, 0, 0, 0.1)",
        zIndex: 10,
    },
    rightSpacerColumn: {
        flex: 1,
        display: "block", /* Keeps the right side empty so background asset isn't hidden */
    },
    formCard: {
        width: "100%",
    },
    brandTitle: {
        fontSize: "32px",
        fontWeight: 800,
        marginBottom: "32px",
        textAlign: "left",
        letterSpacing: "-0.02em",
    },
    gradientText: {
        background: "linear-gradient(to right, #3B82F6, #A855F7)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    fieldGroup: {
        marginBottom: "24px",
    },
    fieldLabel: {
        display: "flex",
        alignItems: "center",
        color: "#4B5563",
        fontSize: "14px",
        fontWeight: 600,
        marginBottom: "8px",
    },
    fieldIcon: {
        marginRight: "8px",
        color: "#4B5563",
        width: "14px",
        height: "14px",
    },
    textInput: {
        width: "100%",
        padding: "12px 16px",
        border: "1px solid #D1D5DB",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#1F2937",
        outline: "none",
        backgroundColor: "#FFFFFF",
        boxSizing: "border-box",
    },
    actionWrapper: {
        marginTop: "32px",
    },
    primarySubmitBtn: {
        width: "100%",
        background: "linear-gradient(to right, #3B82F6, #A855F7)",
        color: "#FFFFFF",
        fontWeight: 700,
        padding: "14px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontSize: "15px",
        boxShadow: "0 4px 12px rgba(147, 51, 234, 0.2)",
    },
    supportLinkCenter: {
        textAlign: "center",
        marginTop: "20px",
    },
    forgotPassLink: {
        color: "#6B7280",
        fontSize: "13px",
        textDecoration: "none",
        fontWeight: 500,
    },
};

export default LoginForm;