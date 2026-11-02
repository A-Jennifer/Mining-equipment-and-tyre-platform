/**
 * MineMap — Interactive geospatial map of South Indian mine sites and equipment using Leaflet.
 * Shows Neyveli OCP (TN), Kothagudem OCP (TS), and Donimalai OCP (KA) with machine pins.
 * Clicking a machine pin lets the user open its full record.
 */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Button } from "./ui";

// Geographic centroids for the mine sites
const SITE_COORDINATES = {
  "Neyveli OCP": { lat: 11.5388, lng: 79.4862, zoom: 14, state: "Tamil Nadu", type: "Lignite Open Cast" },
  "Kothagudem OCP": { lat: 17.551, lng: 80.617, zoom: 14, state: "Telangana", type: "Coal Open Cast" },
  "Donimalai OCP": { lat: 15.05, lng: 76.62, zoom: 14, state: "Karnataka", type: "Iron Ore Open Cast" }
};

// Center of South India mining triangle
const DEFAULT_CENTER = [14.6, 78.8];
const DEFAULT_ZOOM = 7;

function getStatusColor(status) {
  if (status === "Active") return "#10b981"; // emerald
  if (status === "Under Repair") return "#ef4444"; // red
  return "#94a3b8"; // slate
}

export default function MineMap({ equipment = [], sites = [], onOpen }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [selectedSite, setSelectedSite] = useState("all");

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map if not already done
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: true
      });

      // Add OpenStreetMap tile layer (dark/clean carto or standard OSM)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // Map machines to sites and plot
    const validSites = sites.length > 0 ? sites : Object.keys(SITE_COORDINATES).map((name) => ({ name }));

    validSites.forEach((s) => {
      const siteMeta = SITE_COORDINATES[s.name] || { lat: 13.0, lng: 78.0, zoom: 12 };
      const siteEqs = equipment.filter((e) => e.site === s.name);

      if (selectedSite !== "all" && s.name !== selectedSite) return;

      // Mine site headquarters marker
      const siteIcon = L.divIcon({
        className: "custom-site-marker",
        html: `
          <div style="background:#0284c7; color:#fff; padding:4px 8px; border-radius:12px; font-weight:700; font-size:11px; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.3); border:2px solid #fff; display:flex; align-items:center; gap:4px;">
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#38bdf8;"></span>
            ${s.name} (${siteEqs.length} units)
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [60, 12]
      });

      L.marker([siteMeta.lat, siteMeta.lng], { icon: siteIcon })
        .bindTooltip(`<b>${s.name}</b><br/>${siteMeta.state || ""}`, { direction: "top" })
        .addTo(markersLayer);

      // Machines plotted around the open pit (deterministic small offset)
      siteEqs.forEach((eq, idx) => {
        const angle = (idx * (360 / Math.max(1, siteEqs.length))) * (Math.PI / 180);
        const radius = 0.008 + (idx % 3) * 0.004; // ~800m - 1.5km from centroid
        const eqLat = siteMeta.lat + Math.sin(angle) * radius;
        const eqLng = siteMeta.lng + Math.cos(angle) * radius;
        const color = getStatusColor(eq.status);

        const eqIcon = L.divIcon({
          className: "custom-eq-marker",
          html: `
            <div style="background:${color}; width:24px; height:24px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:bold; cursor:pointer;" title="${eq.name} (${eq.model})">
              🚜
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([eqLat, eqLng], { icon: eqIcon }).addTo(markersLayer);

        // Interactive popup
        const popupContent = document.createElement("div");
        popupContent.style.minWidth = "180px";
        popupContent.style.padding = "4px";
        popupContent.innerHTML = `
          <div style="font-weight:700; font-size:14px; color:#0f172a; margin-bottom:2px;">${eq.name}</div>
          <div style="font-size:11px; color:#64748b; margin-bottom:6px;">${eq.model} · ${eq.type}</div>
          <div style="font-size:12px; margin-bottom:4px;"><b>Site:</b> ${eq.site}</div>
          <div style="font-size:12px; margin-bottom:4px;"><b>Hours:</b> ${eq.hours.toLocaleString()} hrs</div>
          <div style="margin-bottom:8px;"><b>Status:</b> <span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold; background:${color}22; color:${color};">${eq.status}</span></div>
          <button id="open-eq-${eq.id}" style="width:100%; background:#0284c7; color:#fff; border:none; padding:6px 10px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">
            View full record →
          </button>
        `;

        popupContent.querySelector(`#open-eq-${eq.id}`).addEventListener("click", () => {
          map.closePopup();
          if (onOpen) onOpen(eq);
        });

        marker.bindPopup(popupContent);
      });
    });

    // Zoom adjust
    if (selectedSite !== "all" && SITE_COORDINATES[selectedSite]) {
      const coord = SITE_COORDINATES[selectedSite];
      map.setView([coord.lat, coord.lng], coord.zoom, { animate: true });
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
    }
  }, [equipment, sites, selectedSite, onOpen]);

  // Cleanly destroy Leaflet instance when leaving the view
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="stack">
      <div className="panel pad" style={{ paddingBottom: 16 }}>
        <div className="between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="section-label mb-4">GEOSPATIAL FLEET INTELLIGENCE</div>
            <h2 className="display panel-title">Mine Sites & Active Machinery Map</h2>
            <p className="muted-small mt-4">
              Real-time locations across South Indian mining basins. Click any machine pin to inspect hours and status.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="muted-small bold">Filter site:</span>
            <select
              className="filter-select"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="all">All Mine Sites</option>
              {Object.keys(SITE_COORDINATES).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSite("all");
                if (mapInstanceRef.current) mapInstanceRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
              }}
            >
              Reset view
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 18, marginTop: 14, fontSize: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
            <span>Active Unit</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
            <span>Under Repair / Service</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#94a3b8", display: "inline-block" }}></span>
            <span>Idle / Standby</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 8, borderRadius: 2, background: "#0284c7", display: "inline-block" }}></span>
            <span>Site Headquarters</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ overflow: "hidden", height: "540px", position: "relative", zIndex: 1, isolation: "isolate" }}>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "500px" }} />
      </div>
    </div>
  );
}
