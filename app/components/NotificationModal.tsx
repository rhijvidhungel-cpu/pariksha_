"use client";

import { useState } from "react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [notificationType, setNotificationType] = useState<"individual" | "batch" | "department">("individual");
  const [recipientType, setRecipientType] = useState<"student" | "teacher">("student");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const departments = ["Computer Science", "Electronics", "Mechanical", "Civil"];
  const batches = ["CE-2024", "CS-2020", "ME-2023"];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!title || !message) {
      setStatusMsg({ type: "error", text: "Please fill all fields" });
      return;
    }

    setLoading(true);

    try {
      const apiBaseUrl = "https://pariksha-9qjs.onrender.com";
      const res = await fetch(`${apiBaseUrl}/api/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          notification_type: notificationType,
          recipient_type: recipientType,
          recipient_value: selectedRecipient,
        }),
      });

      if (res.ok) {
        setStatusMsg({ type: "success", text: "Notification sent successfully" });
        setTimeout(() => {
          setTitle("");
          setMessage("");
          setSelectedRecipient("");
          onClose();
        }, 1500);
      } else {
        const data = await res.json();
        setStatusMsg({ type: "error", text: data.detail || "Failed to send notification" });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "Connection error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Send Notification</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSend} style={styles.form}>
          {/* Recipient Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Send To</label>
            <select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value as "student" | "teacher")}
              style={styles.select}
            >
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
            </select>
          </div>

          {/* Notification Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Notification Type</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="individual"
                  checked={notificationType === "individual"}
                  onChange={(e) => setNotificationType(e.target.value as "individual" | "batch" | "department")}
                  style={styles.radio}
                />
                Individual
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="batch"
                  checked={notificationType === "batch"}
                  onChange={(e) => setNotificationType(e.target.value as "individual" | "batch" | "department")}
                  style={styles.radio}
                />
                Batch
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="department"
                  checked={notificationType === "department"}
                  onChange={(e) => setNotificationType(e.target.value as "individual" | "batch" | "department")}
                  style={styles.radio}
                />
                Department
              </label>
            </div>
          </div>

          {/* Recipient Selection */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              {notificationType === "individual"
                ? recipientType === "student"
                  ? "Select Student"
                  : "Select Teacher"
                : notificationType === "batch"
                ? "Select Batch"
                : "Select Department"}
            </label>
            <select
              value={selectedRecipient}
              onChange={(e) => setSelectedRecipient(e.target.value)}
              style={styles.select}
              required
            >
              <option value="">-- Choose --</option>
              {notificationType === "batch" &&
                batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              {notificationType === "department" &&
                departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              {notificationType === "individual" && (
                <>
                  <option value="user1">User 1</option>
                  <option value="user2">User 2</option>
                  <option value="user3">User 3</option>
                </>
              )}
            </select>
          </div>

          {/* Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Notification Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              placeholder="e.g., Important Announcement"
              required
            />
          </div>

          {/* Message */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={styles.textarea}
              placeholder="Type your notification message..."
              rows={4}
              required
            />
          </div>

          {statusMsg && (
            <div
              style={{
                ...styles.message,
                ...(statusMsg.type === "error"
                  ? styles.errorMessage
                  : styles.successMessage),
              }}
            >
              {statusMsg.text}
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
    maxWidth: "500px",
    width: "90%",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2E1A47",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#6B7280",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  textarea: {
    padding: "10px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
  },
  select: {
    padding: "10px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  radioGroup: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  radio: {
    cursor: "pointer",
  },
  message: {
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    textAlign: "center",
  },
  successMessage: {
    backgroundColor: "#D1FAE5",
    color: "#065F46",
  },
  errorMessage: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  cancelBtn: {
    flex: 1,
    padding: "10px 16px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    backgroundColor: "#F3F4F6",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "500",
  },
  submitBtn: {
    flex: 1,
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#4F46E5",
    color: "white",
    cursor: "pointer",
    fontWeight: "500",
  },
};
