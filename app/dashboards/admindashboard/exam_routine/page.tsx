"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadRoutinePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Guard
  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "admin") {
      router.push("/");
    }
  }, [router]);

  // Handle file drop/selection change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Ensure it is a PDF
      if (selectedFile.type !== "application/pdf") {
        setMessage({ type: "error", text: "Please select a valid PDF file." });
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setMessage(null);
    }
  };

  // Handle Form Submission
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: "error", text: "Please select a file first." });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    // Create FormData payload
    const formData = new FormData();
    formData.append("routine", file);

    try {
      // Connects directly to your live Render API server
      const response = await fetch("https://pariksha-9qjs.onrender.com/api/admin/upload-routine", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Exam routine uploaded successfully!" });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload file.");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "An error occurred during upload." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => router.back()}>
          ← Back to Dashboard
        </button>
        <h2 style={styles.title}>Upload Exam Routine</h2>
        <p style={styles.subtitle}>Upload the examination schedule in PDF format to process structural mappings.</p>
      </div>

      <div style={styles.card}>
        <form onSubmit={handleUpload}>
          <div style={styles.dropZone} onClick={() => fileInputRef.current?.click()}>
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <span style={styles.uploadIcon}>📄</span>
            <p style={styles.dropText}>
              {file ? `Selected: ${file.name}` : "Click to browse or drag & drop your PDF here"}
            </p>
            {file && <p style={styles.fileSize}>({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </div>

          {message && (
            <div style={{
              ...styles.messageBanner,
              backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2",
              borderColor: message.type === "success" ? "#10B981" : "#EF4444",
              color: message.type === "success" ? "#065F46" : "#991B1B"
            }}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || isUploading}
            style={{
              ...styles.submitButton,
              backgroundColor: !file || isUploading ? "#9CA3AF" : "#3B82F6",
              cursor: !file || isUploading ? "not-allowed" : "pointer"
            }}
          >
            {isUploading ? "Uploading Routine..." : "Upload and Process PDF"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
  },
  header: {
    marginBottom: "24px",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#4B5563",
    fontSize: "13px",
    cursor: "pointer",
    marginBottom: "12px",
    padding: 0,
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 4px 0",
  },
  subtitle: {
    fontSize: "13px",
    color: "#6B7280",
    margin: 0,
  },
  card: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  dropZone: {
    border: "2px dashed #D1D5DB",
    borderRadius: "8px",
    padding: "40px 20px",
    textAlign: "center",
    cursor: "pointer",
    backgroundColor: "#F9FAFB",
    transition: "border-color 0.2s",
    marginBottom: "20px",
  },
  uploadIcon: {
    fontSize: "36px",
    display: "block",
    marginBottom: "12px",
  },
  dropText: {
    fontSize: "14px",
    color: "#374151",
    margin: 0,
    fontWeight: 500,
  },
  fileSize: {
    fontSize: "12px",
    color: "#6B7280",
    marginTop: "4px",
    margin: 0,
  },
  messageBanner: {
    border: "1px solid",
    borderRadius: "6px",
    padding: "12px 16px",
    fontSize: "13px",
    marginBottom: "20px",
  },
  submitButton: {
    width: "100%",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "12px",
    fontSize: "14px",
    fontWeight: 600,
    transition: "background-color 0.2s",
  },
};