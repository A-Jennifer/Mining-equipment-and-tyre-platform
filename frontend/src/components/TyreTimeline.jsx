import { CheckCircle2, Clock, RefreshCw, Wrench, ShieldAlert } from "lucide-react";

export default function TyreTimeline({ tyre }) {
  if (!tyre) return null;

  const pct = Math.round((tyre.hours / tyre.threshold) * 100);
  const req = tyre.request || { status: "None" };

  // Calculate realistic past timeline milestones based on current operating hours
  const events = [
    {
      title: "New Tyre Fitted & Commissioned",
      date: "Initial Installation",
      desc: `Mounted onto ${tyre.equipment} (${tyre.position}). Torque checked to factory OEM spec.`,
      icon: CheckCircle2,
      color: "#10b981",
      badge: "Completed"
    }
  ];

  if (tyre.hours >= 1500) {
    events.push({
      title: "Scheduled Rotation & Pressure Check",
      date: `At ~1,500 hrs`,
      desc: "Cross-axle tyre rotation conducted to ensure even tread wear pattern. Rim bead inspected.",
      icon: RefreshCw,
      color: "#3b82f6",
      badge: "Completed"
    });
  }

  if (tyre.hours >= 3000) {
    events.push({
      title: "Ultrasonic Tread Depth & NDT Inspection",
      date: `At ~3,000 hrs`,
      desc: "Tread groove measurement recorded. Non-destructive testing for belt cord fatigue.",
      icon: Wrench,
      color: "#8b5cf6",
      badge: "Completed"
    });
  }

  // Current milestone
  events.push({
    title: `Operating Lifecycle (${pct}% Wear)`,
    date: "Current Status",
    desc: `Logged ${tyre.hours.toLocaleString()} operating hours out of ${tyre.threshold.toLocaleString()} hr design life.`,
    icon: Clock,
    color: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#10b981",
    badge: tyre.status
  });

  // Request milestone if active
  if (req.status !== "None") {
    let title = "Replacement Request Raised";
    let color = "#f59e0b";
    let desc = `Technician (${req.by || "technician"}) raised request: "${req.reason || "Wear limit reached"}"`;

    if (req.status === "Approved") {
      title = "Replacement Request Approved";
      color = "#10b981";
      desc = `Approved by Site Manager. Work order assigned. ${req.note ? `Note: "${req.note}"` : ""}`;
    } else if (req.status === "Rejected") {
      title = "Replacement Request Reviewed (Rejected)";
      color = "#ef4444";
      desc = `Manager feedback: "${req.note || "Continue monitoring"}"`;
    } else if (req.status === "Completed") {
      title = "Replacement Work Order Completed";
      color = "#0284c7";
      desc = "Tyre dismounted and replaced. Sent for retreading / casing analysis.";
    }

    events.push({
      title,
      date: req.status,
      desc,
      icon: ShieldAlert,
      color,
      badge: req.status
    });
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div className="section-label mb-8" style={{ fontSize: 11, letterSpacing: 1 }}>
        TYRE LIFECYCLE TIMELINE
      </div>

      <div style={{ position: "relative", paddingLeft: 24, borderLeft: "2px solid #e2e8f0", marginLeft: 8 }}>
        {events.map((ev, i) => {
          const Icon = ev.icon;
          return (
            <div key={i} style={{ marginBottom: i === events.length - 1 ? 0 : 20, position: "relative" }}>
              {/* Timeline circle node */}
              <div
                style={{
                  position: "absolute",
                  left: -33,
                  top: 0,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: ev.color,
                  border: "3px solid #fff",
                  boxShadow: "0 0 0 1px #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Icon size={10} color="#fff" strokeWidth={2.5} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{ev.title}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: `${ev.color}18`,
                    color: ev.color
                  }}
                >
                  {ev.badge}
                </span>
              </div>
              <div className="muted-tiny" style={{ marginTop: 2 }}>{ev.date}</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{ev.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
