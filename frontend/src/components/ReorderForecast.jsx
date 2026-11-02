import { useMemo } from "react";
import { ShoppingCart, Download } from "lucide-react";
import { tyreHealth } from "../lib/fleet";
import { exportToCsv } from "../utils/export";
import { Button } from "./ui";

export default function ReorderForecast({ tyres = [], selectedSite = "All sites" }) {
  const forecast = useMemo(() => {
    const list = selectedSite === "All sites" ? tyres : tyres.filter((t) => t.site === selectedSite);

    // Filter tyres needing replacement within next 30 days
    const next30 = [];
    const next60 = [];

    list.forEach((t) => {
      const h = tyreHealth(t);
      if (h.daysLeft <= 30 && t.status !== "Replaced") {
        next30.push({ ...t, daysLeft: h.daysLeft, healthScore: h.score });
      } else if (h.daysLeft <= 60 && t.status !== "Replaced") {
        next60.push({ ...t, daysLeft: h.daysLeft, healthScore: h.score });
      }
    });

    const cost30 = next30.reduce((acc, t) => acc + (t.cost || 950000), 0);
    const cost60 = (next30.length + next60.length) * 950000;

    // Group by site
    const bySite = {};
    next30.forEach((t) => {
      bySite[t.site] = (bySite[t.site] || 0) + 1;
    });

    return {
      count30: next30.length,
      cost30,
      cost30Lakh: (cost30 / 100000).toFixed(2),
      count60: next30.length + next60.length,
      cost60Lakh: (cost60 / 100000).toFixed(2),
      items: next30,
      bySite
    };
  }, [tyres, selectedSite]);

  const handleExportProcurement = () => {
    const columns = [
      { header: "Tyre Code", accessor: (r) => r.id },
      { header: "Equipment", accessor: (r) => r.equipment },
      { header: "Position", accessor: (r) => r.position },
      { header: "Brand & Model", accessor: (r) => r.brand },
      { header: "Size", accessor: (r) => r.size || "Standard" },
      { header: "Current Usage (hrs)", accessor: (r) => r.hours },
      { header: "Threshold (hrs)", accessor: (r) => r.threshold },
      { header: "Health Score", accessor: (r) => r.healthScore },
      { header: "Days Remaining", accessor: (r) => r.daysLeft },
      { header: "Estimated Unit Cost (INR)", accessor: (r) => r.cost || 950000 },
      { header: "Mine Site", accessor: (r) => r.site }
    ];
    exportToCsv(`Reorder_Forecast_Procurement_${selectedSite.replace(/\s+/g, "_")}`, columns, forecast.items);
  };

  return (
    <section className="panel mt-20">
      <div className="panel-heading">
        <div>
          <div className="section-label mb-4">PREDICTIVE PROCUREMENT INTELLIGENCE</div>
          <h2 className="display panel-title">30-Day Tyre Reorder Forecast</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {forecast.count30 > 0 && (
            <Button size="sm" variant="outline" onClick={handleExportProcurement}>
              <Download size={14} /> Export procurement list
            </Button>
          )}
        </div>
      </div>

      <div className="pad">
        <div
          style={{
            background: "linear-gradient(135deg, rgba(237, 174, 18, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)",
            border: "1px solid rgba(237, 174, 18, 0.25)",
            borderRadius: 8,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#edae12",
                color: "#17130e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ShoppingCart size={22} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#8a5800", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Executive Procurement Alert
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#17130e", marginTop: 2 }}>
                {selectedSite === "All sites" ? "Your fleet" : selectedSite} will need{" "}
                <span style={{ color: "#c2410c", textDecoration: "underline" }}>{forecast.count30} new tyres</span> in the next 30 days
              </div>
              <div style={{ fontSize: 13, color: "#5c4014", marginTop: 2 }}>
                Estimated procurement capital required: <strong>₹{forecast.cost30Lakh} Lakh</strong> (~₹{(forecast.cost30 / 10000000).toFixed(2)} Cr)
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, borderLeft: "1px solid rgba(237, 174, 18, 0.3)", paddingLeft: 18 }}>
            <div>
              <div className="muted-tiny">60-DAY OUTLOOK</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{forecast.count60} tyres</div>
              <div className="muted-tiny">₹{forecast.cost60Lakh} Lakh</div>
            </div>
            <div>
              <div className="muted-tiny">DAILY BURN RATE</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>~17 hrs/day</div>
              <div className="muted-tiny">Across active fleet</div>
            </div>
          </div>
        </div>

        {/* Site breakdown chips */}
        {selectedSite === "All sites" && Object.keys(forecast.bySite).length > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span className="muted-small bold">Site breakdown:</span>
            {Object.entries(forecast.bySite).map(([site, count]) => (
              <span
                key={site}
                style={{
                  background: "#f1f5f9",
                  padding: "4px 10px",
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#334155"
                }}
              >
                {site}: <strong>{count} {count === 1 ? "tyre" : "tyres"}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Tyres table */}
        {forecast.items.length > 0 ? (
          <div style={{ marginTop: 16, overflowX: "auto" }}>
            <table className="data-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Tyre Code</th>
                  <th>Mounted Machine</th>
                  <th>Position</th>
                  <th>Brand & Size</th>
                  <th>Health Score</th>
                  <th>Replacement Due</th>
                  <th>Estimated Unit Cost</th>
                </tr>
              </thead>
              <tbody>
                {forecast.items.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.id}</strong></td>
                    <td>{t.equipment}</td>
                    <td>{t.position}</td>
                    <td>{t.brand} · {t.size}</td>
                    <td>
                      <span className={`health-badge ${t.healthScore < 40 ? "critical" : "warning"}`}>
                        {t.healthScore}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: t.daysLeft <= 7 ? "#dc2626" : "#d97706" }}>
                        {t.daysLeft === 0 ? "Due Now" : `In ~${t.daysLeft} days`}
                      </strong>
                    </td>
                    <td>₹{( (t.cost || 950000) / 100000).toFixed(2)} Lakh</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state" style={{ marginTop: 12 }}>
            All tyres at this site currently have over 30 days of predicted operating life.
          </p>
        )}
      </div>
    </section>
  );
}
