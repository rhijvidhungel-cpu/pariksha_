"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/api";

interface NotificationItem {
  notification_id: number;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    try {
      const [listRes, countRes] = await Promise.all([
        fetch(`${API_BASE}/api/notifications/me?user_id=${userId}`),
        fetch(`${API_BASE}/api/notifications/unread-count?user_id=${userId}`),
      ]);
      const list = await listRes.json();
      const count = await countRes.json();
      setItems(Array.isArray(list) ? list : []);
      setUnread(typeof count?.count === "number" ? count.count : 0);
    } catch {
      setItems([]);
      setUnread(0);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markRead(notificationId: number) {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: Number(userId) }),
    });
    loadNotifications();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) loadNotifications();
        }}
        className="relative p-1.5 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer"
        aria-label="Notifications"
      >
        {unread > 0 && (
          <span className="absolute top-[4px] right-[4px] min-w-[18px] h-[18px] px-1 rounded-full bg-[#4F46E5] border-2 border-white text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-[100]">
          <div className="px-4 py-3 border-b border-[#E5E7EB] font-bold text-sm text-[#111827]">
            Notifications
          </div>
          {items.length === 0 ? (
            <p className="p-4 text-sm text-[#6B7280]">No notifications yet.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.notification_id}
                type="button"
                onClick={() => markRead(item.notification_id)}
                className={`w-full text-left px-4 py-3 border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors cursor-pointer border-none ${
                  item.is_read ? "bg-white" : "bg-[#EEF2FF]"
                }`}
              >
                <p className="text-sm font-bold text-[#111827] m-0">{item.title}</p>
                <p className="text-xs text-[#6B7280] mt-1 m-0 line-clamp-2">{item.message}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-1 m-0">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
