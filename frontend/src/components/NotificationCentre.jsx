/**
 * NotificationCentre — bell icon with dropdown history.
 * Receives live socket events via useSocket().
 * Shows "Request raised", "Approved", "Job assigned", "Job completed".
 */
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, ClipboardCheck, Hammer, X } from "lucide-react";
import { useSocket } from "../context/SocketContext";

const ACTION_META = {
  "Request raised":               { icon: ClipboardCheck, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "Request approved · Job assigned": { icon: CheckCircle2,  color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  "Request rejected":             { icon: X,              color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  "Job completed":                { icon: Hammer,         color: "#60a5fa", bg: "rgba(96,165,250,0.12)" }
};

function timeSince(isoStr) {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60)  return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(isoStr).toLocaleDateString();
}

export default function NotificationCentre({ legacyAlerts = [], onLegacyClick }) {
  const { notifications, clearAll } = useSocket();
  const [open, setOpen] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  const ref = useRef(null);

  // Count truly new (socket) notifications since last open
  useEffect(() => {
    if (!open) {
      setNewCount(notifications.length - seenCount);
    }
  }, [notifications.length, open, seenCount]);

  const handleOpen = () => {
    setOpen(true);
    setSeenCount(notifications.length);
    setNewCount(0);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const totalBadge = newCount + legacyAlerts.length;

  return (
    <div className="relative" ref={ref}>
      <button
        className="notif-bell-btn"
        aria-label={`Notifications — ${totalBadge} new`}
        onClick={() => (open ? setOpen(false) : handleOpen())}
      >
        <Bell size={18} />
        {totalBadge > 0 && (
          <span className="notif-bell-badge">{totalBadge > 9 ? "9+" : totalBadge}</span>
        )}
      </button>

      {open && (
        <div className="notif-centre-panel">
          <div className="notif-centre-header">
            <span className="notif-centre-title">Notifications</span>
            {notifications.length > 0 && (
              <button className="notif-clear-btn" onClick={clearAll}>Clear all</button>
            )}
          </div>

          <div className="notif-centre-list">
            {/* Live socket notifications */}
            {notifications.map((n) => {
              const meta = ACTION_META[n.action] || ACTION_META["Job completed"];
              const Icon = meta.icon;
              return (
                <div key={n.id} className="notif-centre-item" style={{ background: meta.bg }}>
                  <span className="notif-centre-icon" style={{ color: meta.color }}>
                    <Icon size={15} />
                  </span>
                  <div className="notif-centre-body">
                    <div className="notif-centre-action" style={{ color: meta.color }}>{n.action}</div>
                    <div className="notif-centre-detail">{n.detail}</div>
                    <div className="notif-centre-meta">
                      {n.actor} · {timeSince(n.at)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Legacy static alerts from existing logic */}
            {legacyAlerts.map((a, i) => (
              <button key={`legacy-${i}`} className="notif-centre-item notif-centre-item-btn" onClick={() => { a.onClick?.(); setOpen(false); }}>
                <span className="notif-centre-icon" style={{ color: "#f59e0b" }}>
                  <ClipboardCheck size={15} />
                </span>
                <div className="notif-centre-body">
                  <div className="notif-centre-action" style={{ color: "#f59e0b" }}>{a.label}</div>
                </div>
              </button>
            ))}

            {notifications.length === 0 && legacyAlerts.length === 0 && (
              <div className="notif-centre-empty">No notifications yet. Activity will appear here live.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
