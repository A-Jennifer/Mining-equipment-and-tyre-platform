import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Bot, Camera, CameraOff, Gauge, Printer, Radio, Search, Send, Siren, Thermometer, Trophy } from "lucide-react";
import { Button, Input } from "./ui";
import { tyreFactors, tyreHealth } from "../lib/fleet";
import { useI18n } from "../lib/i18n";

/* =====================================================================
   QR code helpers
   ===================================================================== */
export function AssetQr({ id, size = 132 }) {
  return <QRCodeSVG value={id} size={size} level="M" includeMargin bgColor="#ffffff" fgColor="#17130e" />;
}

export function printLabel(id, title) {
  const svg = document.getElementById(`qr-${id}`)?.innerHTML ?? "";
  const w = window.open("", "_blank", "width=420,height=520");
  if (!w) return;
  w.document.write(
    `<html><head><title>${id}</title></head><body style="font-family:sans-serif;text-align:center;padding:30px">${svg}<h2 style="margin:12px 0 4px">${id}</h2><div>${title}</div><p style="font-size:11px;color:#666">Scan with STRATA asset lookup</p><script>window.onload=()=>window.print()</script></body></html>`
  );
  w.document.close();
}

/* =====================================================================
   QR lookup  (camera scan or typed code)
   ===================================================================== */
export function QrLookup({ equipment, tyres, onOpen }) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null); // null | "none" | asset
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState("");
  const scannerRef = useRef(null);

  function lookup(raw) {
    const id = raw.trim().toUpperCase();
    setCode(id);
    setResult(equipment.find((e) => e.id === id) || tyres.find((t) => t.id === id) || "none");
  }

  async function stopScan() {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch (_) {
      /* already stopped */
    }
    scannerRef.current = null;
    setScanning(false);
  }

  async function startScan() {
    setCamError("");
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (text) => {
          lookup(text);
          stopScan();
        },
        () => {}
      );
    } catch (_) {
      setCamError("Camera unavailable. Allow camera access or type the code instead.");
      setScanning(false);
    }
  }

  useEffect(
    () => () => {
      scannerRef.current?.stop().catch(() => {});
    },
    []
  );

  const all = [
    ...equipment.map((e) => ({ id: e.id, title: e.name })),
    ...tyres.map((t) => ({ id: t.id, title: `${t.brand} · ${t.position}` }))
  ];
  const found = result && result !== "none" ? result : null;
  const health = found && found.kind === "tyre" ? tyreHealth(found) : null;

  return (
    <div className="stack">
      <div className="two-column no-top">
        <section className="panel pad">
          <div className="section-label">{t("SCAN OR ENTER CODE")}</div>
          <h2 className="display panel-title mt-4">{t("Asset lookup")}</h2>
          <form
            className="row-gap mt-14"
            onSubmit={(e) => {
              e.preventDefault();
              lookup(code);
            }}
          >
            <div className="search-wrap grow">
              <Search size={16} />
              <Input aria-label="Asset code" placeholder="e.g. TY-3109 or EQ-2041" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <Button type="submit">{t("Look up")}</Button>
          </form>
          <div className="mt-12">
            {!scanning ? (
              <Button variant="outline" onClick={startScan}>
                <Camera size={15} /> {t("Scan with camera")}
              </Button>
            ) : (
              <Button variant="outline" onClick={stopScan}>
                <CameraOff size={15} /> {t("Stop camera")}
              </Button>
            )}
          </div>
          <div id="qr-reader" className={`qr-reader ${scanning ? "" : "hidden"}`} />
          {camError && <p className="error-note">{camError}</p>}
        </section>

        <section className="panel pad">
          <div className="section-label">{t("LIVE RECORD")}</div>
          {!result && <p className="empty-state">{t("Scan a label or type a code to see the asset instantly.")}</p>}
          {result === "none" && <p className="empty-state">No asset found for “{code}”.</p>}
          {found && (
            <div className="mt-8">
              <h3 className="display big-name">{found.kind === "equipment" ? found.name : found.brand}</h3>
              <p className="muted-small">
                {found.id} · {found.site}
              </p>
              <div className="detail-grid">
                {found.kind === "equipment" ? (
                  <>
                    <Info l={t("Type") || "Type"} v={found.type} />
                    <Info l={t("Status") || "Status"} v={t(found.status) || found.status} />
                    <Info l={t("Usage hours") || "Usage hours"} v={`${found.hours.toLocaleString()} hrs`} />
                    <Info l={t("Site") || "Site"} v={found.site} />
                  </>
                ) : (
                  <>
                    <Info l={t("Mounted on") || "Mounted on"} v={`${found.equipment} · ${found.position}`} />
                    <Info l="Usage / threshold" v={`${found.hours.toLocaleString()} / ${found.threshold.toLocaleString()} hrs`} />
                    <Info l={t("Health") || "Health score"} v={`${health.score} / 100`} />
                    <Info l={t("Replace in") || "Replace in"} v={health.daysLeft === 0 ? "Now" : `~${health.daysLeft} days`} />
                  </>
                )}
              </div>
              <Button className="mt-20" variant="outline" onClick={() => onOpen(found)}>
                {t("Open full record")}
              </Button>
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="section-label mb-4">{t("PRINTABLE LABELS")}</div>
            <h2 className="display panel-title">{t("Asset QR codes")}</h2>
          </div>
        </div>
        <div className="qr-grid">
          {all.map((a) => (
            <div key={a.id} className="qr-card">
              <button id={`qr-${a.id}`} className="qr-btn" onClick={() => lookup(a.id)} aria-label={`Look up ${a.id}`}>
                <AssetQr id={a.id} size={104} />
              </button>
              <strong>{a.id}</strong>
              <span>{a.title}</span>
              <Button size="sm" variant="ghost" onClick={() => printLabel(a.id, a.title)}>
                <Printer size={13} /> {t("Print")}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* =====================================================================
   Live sensor feed  (simulated, ready for real IoT data)
   ===================================================================== */
const SAFE = { pMin: 88, pMax: 112, tMax: 85 };

export function SensorFeed({ tyres, onOpen }) {
  const { t } = useI18n();
  const [readings, setReadings] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [live, setLive] = useState(true);
  const [ticks, setTicks] = useState(0);
  const readingsRef = useRef({});

  useEffect(() => {
    if (!live) return undefined;
    const interval = setInterval(() => {
      const prev = readingsRef.current;
      const next = {};
      const fresh = [];

      tyres.forEach((t) => {
        const base = prev[t.id] || { pressure: 100, temp: tyreFactors(t).temp };
        const pressure = +(base.pressure + (Math.random() - 0.5) * 7 + (100 - base.pressure) * 0.15).toFixed(1);
        const temp = +(base.temp + (Math.random() - 0.45) * 5 + (tyreFactors(t).temp - base.temp) * 0.12).toFixed(1);
        next[t.id] = { pressure, temp };

        if (pressure < SAFE.pMin || pressure > SAFE.pMax)
          fresh.push({ key: Date.now() + Math.random(), id: t.id, text: `${t.id} pressure ${pressure} psi out of safe range` });
        if (temp > SAFE.tMax)
          fresh.push({ key: Date.now() + Math.random(), id: t.id, text: `${t.id} temperature ${temp}°C above limit` });
      });

      readingsRef.current = next;
      setReadings(next);
      setTicks((n) => n + 1);
      if (fresh.length) setAlerts((a) => [...fresh, ...a].slice(0, 6));
    }, 2000);
    return () => clearInterval(interval);
  }, [live, tyres]);

  return (
    <div className="stack">
      <div className="row-gap wrap">
        <span className={`status ${live ? "good live-pulse" : "monitor"}`}>{live ? t("Live") || "Live" : t("Paused") || "Paused"}</span>
        <span className="muted-small">Simulated tyre sensors · refresh every 2s · {ticks} updates</span>
        <Button size="sm" variant="outline" className="push-right" onClick={() => setLive(!live)}>
          {live ? t("Pause feed") : t("Resume feed")}
        </Button>
      </div>

      {alerts.length > 0 && (
        <div className="stack tight">
          {alerts.map((a) => (
            <button
              key={a.key}
              className="sensor-alert"
              onClick={() => {
                const t = tyres.find((x) => x.id === a.id);
                if (t) onOpen(t);
              }}
            >
              <Siren size={15} />
              {a.text}
            </button>
          ))}
        </div>
      )}

      {tyres.length === 0 && <div className="panel empty-state">No tyres at this site.</div>}

      <div className="sensor-grid">
        {tyres.map((t) => {
          const r = readings[t.id];
          const pBad = r && (r.pressure < SAFE.pMin || r.pressure > SAFE.pMax);
          const tBad = r && r.temp > SAFE.tMax;
          return (
            <button key={t.id} className={`panel sensor-card ${pBad || tBad ? "danger" : ""}`} onClick={() => onOpen(t)}>
              <div className="between">
                <strong className="small-strong">{t.id}</strong>
                <Radio size={14} className={live ? "icon-live" : "icon-muted"} />
              </div>
              <div className="muted-tiny">
                {t.equipment} · {t.position}
              </div>
              <div className="sensor-values">
                <div>
                  <div className="detail-label with-icon">
                    <Gauge size={11} /> Pressure
                  </div>
                  <div className={`sensor-value ${pBad ? "bad" : ""}`}>
                    {r ? r.pressure : "--"}
                    <small> psi</small>
                  </div>
                </div>
                <div>
                  <div className="detail-label with-icon">
                    <Thermometer size={11} /> Temp
                  </div>
                  <div className={`sensor-value ${tBad ? "bad" : ""}`}>
                    {r ? r.temp : "--"}
                    <small> °C</small>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="muted-small">
        Safe limits: {SAFE.pMin}–{SAFE.pMax} psi, below {SAFE.tMax}°C. Ready to swap simulated values for real IoT sensors.
      </p>
    </div>
  );
}

/* =====================================================================
   Brand cost-per-running-hour (decision support)
   ===================================================================== */
export function BrandInsights({ tyres }) {
  const brands = Array.from(new Set(tyres.map((t) => t.brand)))
    .map((brand) => {
      const list = tyres.filter((t) => t.brand === brand);
      const cph = list.reduce((sum, t) => sum + t.cost / t.threshold, 0) / list.length;
      const health = Math.round(list.reduce((sum, t) => sum + tyreHealth(t).score, 0) / list.length);
      return { brand, cph, health, count: list.length };
    })
    .sort((a, b) => a.cph - b.cph);

  const max = Math.max(1, ...brands.map((b) => b.cph));
  const best = brands[0];

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <div className="section-label mb-4">DECISION SUPPORT</div>
          <h2 className="display panel-title">Cost per running hour</h2>
        </div>
        <Trophy size={19} className="icon-muted" />
      </div>
      <div className="pad">
        {best ? (
          <div className="best-brand">
            <Trophy size={16} />
            <div>
              <strong>{best.brand}</strong> gives the best value at ₹{Math.round(best.cph).toLocaleString("en-IN")}/hr.
            </div>
          </div>
        ) : (
          <p className="empty-state">No tyre data yet.</p>
        )}
        {brands.map((b) => (
          <div key={b.brand} className="brand-row">
            <div className="between brand-head">
              <span>
                {b.brand}{" "}
                <span className="muted-normal">
                  · {b.count} tyres · avg health {b.health}
                </span>
              </span>
              <span>₹{Math.round(b.cph).toLocaleString("en-IN")}/hr</span>
            </div>
            <div className="progress-track">
              <div className={`progress-fill ${b === best ? "good" : ""}`} style={{ width: `${(b.cph / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =====================================================================
   Query assistant  (rule-based, answers only from your own records)
   ===================================================================== */
export function Assistant({ equipment, tyres, services, siteNames, onOpen }) {
  const [msgs, setMsgs] = useState([
    { role: "bot", text: "Ask me about your fleet. I answer only from the records in this app, and show the exact assets I used." }
  ]);
  const [q, setQ] = useState("");
  const suggestions = [
    "Which tyres on East Quarry need replacement this week?",
    "Show overdue services",
    "Which brand is best value?",
    "Tyres with health below 40",
    "Equipment needing attention"
  ];

  function answer(query) {
    const s = query.toLowerCase();
    const site = siteNames.find((n) => s.includes(n.toLowerCase()) || s.includes(n.toLowerCase().split(" ")[0])) || null;
    const bySite = (list) => (site ? list.filter((x) => x.site === site) : list);
    const where = site ? ` at ${site}` : "";
    const days = s.includes("today") ? 1 : s.includes("week") ? 7 : s.includes("month") ? 30 : null;
    const num = Number((s.match(/(\d+)/) || [])[1]);

    if (s.includes("brand") || s.includes("value") || s.includes("cost")) {
      const ranked = Array.from(new Set(tyres.map((t) => t.brand)))
        .map((brand) => {
          const l = tyres.filter((t) => t.brand === brand);
          return { brand, cph: l.reduce((a, t) => a + t.cost / t.threshold, 0) / l.length };
        })
        .sort((a, b) => a.cph - b.cph);
      const top = ranked[0];
      if (!top) return { role: "bot", text: "No tyre data yet." };
      return {
        role: "bot",
        text: `Best value: ${top.brand} at ₹${Math.round(top.cph)}/running hour. Ranking: ${ranked.map((x) => `${x.brand} (₹${Math.round(x.cph)})`).join(", ")}.`
      };
    }

    if (s.includes("overdue") || s.includes("service") || s.includes("maintenance")) {
      const list = bySite(services).filter((x) => (s.includes("upcoming") ? x.status === "Upcoming" : x.status === "Overdue"));
      const label = s.includes("upcoming") ? "upcoming" : "overdue";
      return {
        role: "bot",
        text: list.length ? `${list.length} ${label} service(s)${where}:` : `No matching services${where}.`,
        items: list.map((x) => ({ id: x.id, label: `${x.title} · ${x.equipment} · ${x.date}` }))
      };
    }

    if (s.includes("equipment") || s.includes("machine") || s.includes("attention")) {
      const list = bySite(equipment).filter((e) => (s.includes("attention") ? e.status === "Under Repair" : true));
      return {
        role: "bot",
        text: `${list.length} machine(s)${where}:`,
        items: list.map((e) => ({ id: e.id, label: `${e.name} · ${e.status} · ${e.hours.toLocaleString()} hrs` }))
      };
    }

    if (s.includes("tyre") || s.includes("tire") || s.includes("replace") || s.includes("health")) {
      let list = bySite(tyres);
      let rule = "all tyres";
      if (s.includes("health") && num) {
        list = list.filter((t) => tyreHealth(t).score < num);
        rule = `health score below ${num}`;
      } else if (s.includes("replace") || days) {
        const d = days || 14;
        list = list.filter((t) => tyreHealth(t).daysLeft <= d);
        rule = `predicted replacement within ${d} days`;
      }
      return {
        role: "bot",
        text: list.length ? `${list.length} tyre(s)${where} with ${rule}:` : `No tyres${where} match: ${rule}.`,
        items: list.map((t) => {
          const h = tyreHealth(t);
          return { id: t.id, label: `${t.id} · ${t.brand} on ${t.equipment} · health ${h.score} · ~${h.daysLeft} days` };
        })
      };
    }

    return { role: "bot", text: "I couldn't map that to fleet data. Try asking about tyres, replacement, health, services, equipment or brand value." };
  }

  function send(text) {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text }, answer(text)]);
    setQ("");
  }

  const openId = (id) => {
    const asset = [...equipment, ...tyres, ...services].find((x) => x.id === id);
    if (asset) onOpen(asset);
  };

  return (
    <section className="panel mt-24 chat-panel">
      <div className="panel-heading">
        <div>
          <div className="section-label mb-4">ASK YOUR FLEET</div>
          <h2 className="display panel-title">Query assistant</h2>
        </div>
        <Bot size={19} className="icon-muted" />
      </div>
      <div className="chat-log">
        {msgs.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            <p>{m.text}</p>
            {m.items && (
              <div className="chat-items">
                {m.items.map((it) => (
                  <button key={it.id} className="chat-item" onClick={() => openId(it.id)}>
                    {it.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="chat-chips">
        {suggestions.map((x) => (
          <button key={x} className="chat-chip" onClick={() => send(x)}>
            {x}
          </button>
        ))}
      </div>
      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(q);
        }}
      >
        <Input aria-label="Ask a question" placeholder="Which tyres on East Quarry need replacement this week?" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit" aria-label="Send">
          <Send size={15} />
        </Button>
      </form>
    </section>
  );
}

function Info({ l, v }) {
  return (
    <div>
      <div className="detail-label">{l}</div>
      <div className="detail-value">{v}</div>
    </div>
  );
}